
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

    .factory('AvatarService', function ($kinvey, Avatar) {
        return {
            /**
             *
             * @returns {*}
             */
            find: function() {
                var query = new $kinvey.Query();
                var promise = $kinvey.File.find(query).then(function(_data) {
                    console.log("find: " + JSON.stringify(_data));
                    return _data
                        .map(Avatar.build)
                        .filter(Boolean);
                }, function error(err) {
                    console.log('[find] received error: ' + JSON.stringify(err));
                });

                return promise;
            },
            /**
             *
             * @param {String} _id
             * @returns {*}
             */
            remove: function(_id) {
                return $kinvey.File.destroy(_id);
            },
            /**
             *
             * @param {String} _id
             * @returns {*}
             */
            get: function(_id) {
                // create the kinvey file object
                var promise = $kinvey.File.download(_id).then(function(_data) {
                    console.log("download: " + JSON.stringify(_data));
                    return Avatar.build(_data);
                }, function error(err) {
                    console.log('[download] received error: ' + JSON.stringify(err));
                });

                return promise;
            },
            /**
             *
             * @param {File} _file
             * @returns {*}
             */
            upload: function(_file) {
                var promise = $kinvey.File.upload(_file.file, {
                    _filename: _file.file.name,
                    public: true,
                    size: _file.file.size,
                    mimeType: _file.file.type
                }).then(function(_data) {
                    console.log("$upload: " + JSON.stringify(_data));
                    return Avatar.build(_data);
                }, function error(err) {
                    console.log('[$upload] received error: ' + JSON.stringify(err));
                });

                return promise;
            }
        };
    })

    .service('BeerService', function() {
        var _Beer = function(newID) {
            if( typeof newID === "undefined" ) newID = _this._getNextID();

            return {
                id: newID,
                name: "New beer",
                brewery: "Unknown",

                images: [],

                volume: "22 oz.",
                quantity: 1,
                style: "IPA",
                purchasePrice: 10,
                purchaseDate: DateMath.thisMonth(),
                drinkAfterYears: 3,
                drinkBeforeYears: 6
            }
        };

        this._getNextID = function() {
            var all = _this.allBeers();

            var id;
            if( all.length > 0 ) {
                id = all[ all.length - 1 ].id + 1;
                console.log("Found ID to be " + id);
            } else {
                id = 0;
                console.log("No known beers!");
                console.log(all);
            }

            return id;
        };

        this.newBeer = function() {
            var prop = _Beer();
            console.log("Created new beer with ID " + prop.id);
            _this.save(prop);

            _this.setLastActiveIndex(prop.id);
            return  prop;
        };

        this.getBeerByID = function(id) {
            var beers = _this.allBeers();


            if( beers.length > 0 ) {
                for( var i = 0; i < beers.length; i++ ) {
                    if( beers[i].id == id ) {
                        return beers[i];
                    }
                }

                console.error("Couldn't find beer with ID " + id);
                return beers[0];
            }
            return _this.newBeer();
        };

        this.allBeers = function() {
            // TODO: This is RIDICULOUSLY inefficient --- it's called all the damn time!
            var beersString = window.localStorage['beers'];
            var newBeers = [];
            if(beersString) {
                var beers = angular.fromJson(beersString);

                if( !Array.isArray(beers) ) {
                    console.error("Stored beers list was not an array! Creating a new beers list...");
                    newBeers.push(_Beer(0));
                    return newBeers;
                } else {
                    // TODO: Remove this?
                    // Nuke any beers without an id
                    _.remove( beers, function(prop) {
                        if( typeof prop == "object" && prop ) {
                            if(prop.id == null) console.error("Found a beer without an ID set. Removing it...");
                            return prop.id == null;
                        }

                        console.error("Found a beer that wasn't an object. Removing it...");
                        return true; // Not an object; what's it doing here??
                    });

                    return beers;
                }
            } else {
                console.log("No beer list stored. Creating a new one...");
                newBeers.push(_Beer(0));
                return newBeers;
            }
        };

        /**
         * If beer already exists in the list of beers, it will
         * be updated. If it does not exist, we will append it.
         * @param beer {*}
         * @param beers Array
         * @returns Array The updated beers array
         * @private
         */
        this._addBeerToBeers = function( beer, beers ) {
            var foundBeer = false;
            for( var i = 0; i < beers.length; i++ ) {
                if( beers[i].id === beer.id ) {
                    foundBeer = true;
                    beers[i] = beer;
                    break;
                }
            }

            if( !foundBeer ) {
                beers.push(beer);
            }

            return beers;
        };

        this._orderBeers = function( beers ) {
            function sortByID(a, b){
                return ((a.id < b.id) ? -1 : ((a.id > b.id) ? 1 : 0));
            }

            beers.sort(sortByID);
            return beers;
        };

        this.save = function(beerOrBeers) {
            var beers = [];
            if(!Array.isArray(beerOrBeers)) {
                beers = _this.allBeers();

                var b = beerOrBeers;
                assert( typeof b == "object", "Beer is not an object" );
                beers =  _this._addBeerToBeers( b, beers );
            } else {
                beers = beerOrBeers;
            }

            beers = _this._orderBeers(beers);

            // TODO: make this more efficient?
            window.localStorage['beers'] = angular.toJson(beers);
        };

        this.delete = function( beer ) {
            console.log("Deleting beer", beer);
            var beers = _this.allBeers();
            _.remove(beers, function(prop) {
                return prop.id == beer.id;
            });
            _this.save(beers);
        };

        this.getLastActiveIndex = function() {
            var lastActive = window.localStorage['lastActiveBeer'];
            if( lastActive === undefined ||
                lastActive == null ||
                lastActive == "undefined" ) {
                lastActive = -1;
            }
            return parseInt(lastActive);
        };

        this.setLastActiveIndex = function( indexOrBeer ) {
            if( typeof indexOrBeer == "number" ) {
                window.localStorage['lastActiveBeer'] = indexOrBeer;
            } else {
                window.localStorage['lastActiveBeer'] = _this._getIndexOfBeer(indexOrBeer);
            }

        };

        this._getIndexOfBeer = function( prop ) {
            assert(typeof prop == "object", "Sought beer is not a valid beer object.");

            var all = _this.allBeers();
            for( var i = 0; i < all.length; i++ ) {
                if( all[i].id == prop.id ) {
                    return i;
                }
            }
            return -1;
        };

        var _this = this;
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