
angular.module('BeerCellarApp.services', [])

    .factory('User', function() {

        /**
         * Constructor, with class name
         */
        function User(_data) {
            if(typeof _data === "undefined" || !_data)
                return null;

            // Public properties, assigned to the instance ('this')
            this.firstName = _data.firstName || 'Unknown';
            this.lastName = _data.lastName || 'Unknown';
            this.username = _data.username || 'Unknown';
            this.id = _data._id || 'Unknown';
        }

        /**
         * Public method, assigned to prototype
         */
        User.prototype.getFullName = function () {
            return this.firstName + ' ' + this.lastName;
        };

        /**
         * Static method, assigned to class
         * Instance ('this') is not available in static context
         */
        User.build = function (data) {
            if(data && typeof data != "undefined")
                return new User(data);
            else
                return null;
        };

        /**
         * Return the constructor function
         */
        return User;
    })

    .factory('UserService', function($kinvey, User) {
        var currentUser = null;

        return {
            /**
             *
             * @returns {*}
             */
            activeUser: function () {
                if (currentUser === null) {
                    console.log("Refreshing active user!");
                    currentUser = User.build($kinvey.getActiveUser());
                }
                return currentUser;
            },
            /**
             *
             * @param {String} _username
             * @param {String} _password
             * @returns {*}
             */
            login: function (_username, _password) {
                //Kinvey login starts
                console.log("Logging in user ", _username);
                var promise = $kinvey.User.login({
                    username: _username,
                    password: _password
                });

                promise.then(function (response) {
                    return User.build(response);
                }, function (error) {
                    //Kinvey login finished with error
                    console.log("Error logging in: " + error.description);
                });

                return promise;
            },

            createUser: function(_username, _password) {
                console.log("Creating user ", _username);
                var promise = $kinvey.User.signup({
                    username : _username,
                    password : _password
                });

                promise.then(function (response) {
                    return User.build(response);
                }, function (error) {
                    console.log("Error creating account: " + error.description);
                });

                return promise;
            }
        };
    })

    .factory('Beer', function () {

        /**
         * A beer in our collection
         * @param {Beer=} optionalBeerToClone Clone the name, brewery, etc. from this beer
         * @constructor
         */
        function Beer(optionalBeerToClone) {
            this.name = "New beer";
            this.brewery = "Unknown";
            this.images = [];
            this.volume = "22 oz.";
            this.quantity = 1;
            this.style = "Imperial Stout";
            this.purchasePrice = 10;
            this.purchaseDate = new Date();
            this.drinkAfterYears = 3;
            this.drinkBeforeYears = 6;
            // I'm *really* afraid of collisions!
            this._id = parseInt(Math.random() * 1000).toString() + uuid + Date.now();

            if(optionalBeerToClone) {
                this.name = optionalBeerToClone.name || this.name;
                this.brewery = optionalBeerToClone.brewery || this.brewery;
                this.images = optionalBeerToClone.images || this.images;
                this.volume = optionalBeerToClone.volume || this.volume;
                this.style = optionalBeerToClone.style || this.style;
                this.purchasePrice = optionalBeerToClone.purchasePrice || this.purchasePrice;
                this.purchaseDate = optionalBeerToClone.purchaseDate || this.purchaseDate;
            }
        }

        /**
         * @return {string} Name of the beer
         */
        Beer.prototype.getName = function () {
            return this.name;
        };

        /**
         * @return {string} The volume (e.g., "22 oz." or "750 mL")
         */
        Beer.prototype.getVolume = function () {
            return this.volume;
        };

        /**
         * @return {Number} The number of bottles of this beer (with this volume, purchase date, and drink date) in the collection
         */
        Beer.prototype.getQuantity = function () {
            return this.quantity;
        };

        /**
         * @return {string} A date string (YYYY-MM format) indicating when this beer may be drank
         */
        Beer.prototype.getDrinkDate = function () {
            return DateMath.addYears(this.purchaseDate, this.drinkAfterYears);
        };

        /**
         * @return {string} A date string (YYYY-MM format) indicating the *latest* that this beer should be drank
         */
        Beer.prototype.getDrinkBeforeDate = function () {
            return DateMath.addYears(this.purchaseDate, this.drinkBeforeYears);
        };


        /**
         * Static method, assigned to class
         * Instance ('this') is not available in static context
         */
        Beer.build = function(optionalBeerToClone) {
            return new Beer(optionalBeerToClone);
        };

        /**
         * @return {*} A promise to create a new beer object
         */
        Beer.buildPromise = function() {
            var b = Beer.build();
            return {
                then: function() {
                    return b;
                }
            };
        };

        /**
         * Return the constructor function
         */
        return Beer;
    })

    .factory('BeerService', function ($kinvey, Beer) {
        var DEBUG_BEER_SERVICE = true;
        return {
            /**
             * Search for a particular beer in the database
             * @param _id {string} The ID of the beer to search for
             * @return {*} A promise to return the sought beer
             */
            find: function(_id) {
                assert(typeof _id === "string", "Sought ID is not a string");

                // Replace URL-encoded spaces as necessary;
                _id = _id.replace(/%20/g, " ");

                if(DEBUG_BEER_SERVICE) console.log("Finding beer with ID", _id);

                if(_id === null || typeof _id === "undefined") {
                    assert(typeof _id === "string", "Beer ID was not a string");
                    return Beer.buildPromise();
                } else {
                    return $kinvey.DataStore.get('beers', _id)
                        .then(function(beer) {
                            if(typeof beer.purchaseDate === "string") {
                                beer.purchaseDate = DateMath.dateObjFromString(beer.purchaseDate);
                            }
                            return beer;
                        });
                }
            },

            /**
             * Deletes a beer from the database
             * @param {Beer} beer The beer to delete
             * @returns {*} a promise to destroy the beer
             */
            remove: function(beer) {
                if(DEBUG_BEER_SERVICE) console.log("Deleting beer", beer);
                deletedIDs.push(beer._id);
                return $kinvey.DataStore.destroy('beers', beer._id);
            },

            /**
             * Saves a beer to the database
             * @param {Beer} beer The beer you'd like to save
             * @returns {*} a promise to save the beer
             */
            save: function(beer) {
                if(DEBUG_BEER_SERVICE) console.log("Saving beer", beer);
                if(_.contains(deletedIDs, beer._id)) {
                    return {
                        then: function() {}
                    };
                } else {
                    return $kinvey.DataStore.save('beers', beer);
                }

            },

            /**
             * Fetches all beers in this user's collection
             * @returns {*} a promise to get all the beers
             */
            all: function() {
                if(DEBUG_BEER_SERVICE) console.log("Getting all beers");
                return $kinvey.DataStore.find('beers')
                    .then(function(beers) {
                        for(var i = 0; i < beers.length; i++) {
                            if(typeof beers[i].purchaseDate === "string") {
                                beers[i].purchaseDate = DateMath.dateObjFromString(beers[i].purchaseDate);
                            }
                        }
                        return beers;
                    });
            },

            clean: function() {
                var query = new $kinvey.Query();
                query.equalTo('name', undefined).equalTo('brewery', undefined);

                var secondQuery = new $kinvey.Query();
                secondQuery.equalTo('name', 'New beer').equalTo('brewery', 'Unknown');
                query.or(secondQuery);

                return $kinvey.DataStore.clean('beers', query);
            },

            /**
             * @param {Beer=} optionalBeerToClone Clone the name, brewery, etc. from this beer
             * @return {*} A promise to create a new beer object
             */
            create: function(optionalBeerToClone) {
                if(DEBUG_BEER_SERVICE) console.log("Created new beer");
                var b = Beer.build(optionalBeerToClone);
                return this.save(b);
            },

            /**
             * @return {*} A promise to retrieve the beer that was last accessed/modified by the user
             */
            lastActive: function() {
                if(DEBUG_BEER_SERVICE) console.log("Getting last active beer");

                var lastActive = window.localStorage['lastActiveBeerID'];

                if(lastActive === undefined ||
                    lastActive == null ||
                    typeof lastActive == "undefined") {
                    return Beer.buildPromise();
                }

                return this.find(lastActive);
            },

            /**
             * Synchronously remembers the most recently accessed beer
             * @param beer {Beer} The most recently accessed/modified beer
             */
            setLastActiveBeer: function(beer) {
                if(DEBUG_BEER_SERVICE) console.log("Setting last active beer to:", beer);
                window.localStorage['lastActiveBeerID'] = beer._id;
            }
        };
    })

    .factory('CameraFactory', ['$q', function($q) {
        if( ionic.Platform.isWebView() && ionic.Platform.isReady ) { // running in the Cordova Web view
            return {
                getPicture: function(options) {
                    var q = $q.defer();

                    navigator.camera.getPicture(function(result) {
                        // Do any magic you need
                        q.resolve(result);
                    }, function(err) {
                        q.reject(err);
                    }, options);

                    return q.promise;
                }
            }
        } else {
            return {
                getPicture: function(options) {
                    // TODO: Web implementation?
                    return null;
                }
            }
        }

    }])


;