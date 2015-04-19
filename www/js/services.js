
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
             * @returns {*}
             */
            activeUser: function () {
                if(currentUser === null) {
                    if(window.localStorage[STORAGE_KEY_LOCAL_ONLY] === FALSE) {
                        console.log("Refreshing active user from Kinvey");
                        currentUser = User.build($kinvey.getActiveUser());
                    } else if(window.localStorage[STORAGE_KEY_LOCAL_ONLY] === TRUE) {
                        console.log("User's prefs specified local only user... creating it now");
                        currentUser = User.build({username: LOCAL_USER, _id: LOCAL_USER});
                    }
                }
                if(currentUser !== null) {
                    uuid = currentUser.username;
                }
                return currentUser;
            },
            /**
             * @param {String} _username
             * @param {String} _password
             * @returns {*} promise to do the login
             */
            login: function (_username, _password) {
                if(_username === LOCAL_USER) {
                    currentUser = User.build({username: LOCAL_USER, _id: LOCAL_USER});
                    window.localStorage[STORAGE_KEY_LOCAL_ONLY] = TRUE;
                    return function() {};
                } else {
                    //Kinvey login starts
                    console.log("Logging in user ", _username);
                    var promise = $kinvey.User.login({
                        username: _username,
                        password: _password
                    });

                    promise.then(function (response) {
                        window.localStorage[STORAGE_KEY_LOCAL_ONLY] = FALSE;
                        return User.build(response);
                    }, function (error) {
                        //Kinvey login finished with error
                        console.log("Error logging in: " + error.description);
                    });

                    return promise;
                }
            },

            /**
             * @returns {*} promise to perform the logout
             */
            logout: function() {
                if(window.localStorage[STORAGE_KEY_LOCAL_ONLY] === TRUE) {
                    currentUser = null;
                    return function() {};
                } else {
                    var user = $kinvey.getActiveUser();
                    if(user !== null) {
                        return $kinvey.User.logout();
                    }
                }
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
            _beers: JSON.parse(window.localStorage[STORAGE_KEY_BEERS] || '[]'),

            /**
             * Search for a particular beer in the database
             * @param _id {string} The ID of the beer to search for
             * @return {Beer|null} The sought beer, if applicable
             */
            find: function(_id) {
                assert(typeof _id === "string", "Sought ID is not a string");

                // Replace URL-encoded spaces as necessary;
                _id = _id.replace(/%20/g, " ");

                if(DEBUG_BEER_SERVICE) console.log("Finding beer with ID", _id);

                for(var i = 0; i < this._beers.length; i++) {
                    if(this._beers[i]._id === _id) {
                        if(typeof this._beers[i].purchaseDate === "string") {
                            this._beers[i].purchaseDate = DateMath.dateObjFromString(this._beers[i].purchaseDate);
                        }
                        return this._beers[i];
                    }
                }
                console.log("Failed to find beer with ID", _id);
                return null;
            },

            /**
             * Deletes a beer from the database
             * @param {Beer} beer The beer to delete
             */
            remove: function(beer) {
                if(DEBUG_BEER_SERVICE) console.log("Deleting beer", beer);
                deletedIDs.push(beer._id);

                // Delete from local storage
                for(var i = 0; i < this._beers.length; i++) {
                    if(this._beers[i]._id === beer._id) {
                        this._beers.splice(i, 1);
                        break;
                    }
                }

                // Delete from the DB
                if(window.localStorage[STORAGE_KEY_LOCAL_ONLY] === FALSE) {
                    $kinvey.DataStore.destroy(STORAGE_KEY_BEERS, beer._id);
                }
            },

            /**
             * Saves a beer to the database. This works asynchronously---we *instantly* save it to the local storage,
             * then in the background we do the store to Kinvey (as necessary).
             * @param {Beer} beer The beer you'd like to save
             */
            save: function(beer) {
                if(DEBUG_BEER_SERVICE) console.log("Saving beer", beer);
                if(_.contains(deletedIDs, beer._id)) {
                    return {
                        then: function() {}
                    };
                } else {
                    this._beers.push(beer);
                    window.localStorage[STORAGE_KEY_BEERS] = JSON.stringify(this._beers);
                    if(window.localStorage[STORAGE_KEY_LOCAL_ONLY] === FALSE) {
                        $kinvey.DataStore.save(STORAGE_KEY_BEERS, beer);
                    }
                }

            },

            /**
             * Fetches all beers in this user's collection. Works asynchronously, so that we instantly return what's in the
             * local storage, then update from Kinvey in the background.
             * @returns {*} a promise to get all the beers
             */
            all: function() {
                if(DEBUG_BEER_SERVICE) console.log("Getting all beers");
                var _this = this;
                if(window.localStorage[STORAGE_KEY_LOCAL_ONLY] === FALSE) {
                    $kinvey.DataStore.find(STORAGE_KEY_BEERS)
                        .then(function(beers) {
                            for(var i = 0; i < beers.length; i++) {
                                if(typeof beers[i].purchaseDate === "string") {
                                    beers[i].purchaseDate = DateMath.dateObjFromString(beers[i].purchaseDate);
                                }
                            }
                            _this._beers = beers;
                        });
                }
                return this._beers;
            },

            clean: function() {
                // TODO: Local-only equivalent?
                var query = new $kinvey.Query();
                query.equalTo('name', undefined).equalTo('brewery', undefined);

                var secondQuery = new $kinvey.Query();
                secondQuery.equalTo('name', 'New beer').equalTo('brewery', 'Unknown');
                query.or(secondQuery);

                return $kinvey.DataStore.clean(STORAGE_KEY_BEERS, query);
            },

            /**
             * @param {Beer=} optionalBeerToClone Clone the name, brewery, etc. from this beer
             * @return {Beer} the beer object that was created
             */
            create: function(optionalBeerToClone) {
                if(DEBUG_BEER_SERVICE) console.log("Created new beer");
                var b = Beer.build(optionalBeerToClone);
                this.save(b);
                return b;
            },

            /**
             * @return {Beer} The beer that was last accessed/modified by the user
             */
            lastActive: function() {
                if(DEBUG_BEER_SERVICE) console.log("Getting last active beer");

                var lastActive = window.localStorage['lastActiveBeerID'];

                if(lastActive === undefined ||
                    lastActive == null ||
                    typeof lastActive == "undefined") {
                    return Beer.build();
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

;