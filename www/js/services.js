
angular.module('BeerCellarApp.services', [])

    .service('BeerService', function() {
        var _Beer = function(newID) {
            if( typeof newID === "undefined" ) newID = _this._getNextID();

            return {
                id: newID,
                name: "New beer",
                brewery: "Unknown",

                images: [],

                purchasePrice: 0,
                purchaseDate: 0,
                drinkAfterDate: 0,
                drinkBeforeDate: 0
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

                console.error("ERROR: Couldn't find beer " + id);
                return beers[0];
            }
            return _this.newBeer();
        };

        this.allBeers = function() {
            // TODO: This is RIDICULOUSLY inefficient --- it's called all the damn time!
            var beersString = window.localStorage['beers'];
            var newBeers = [];
            if( beersString ) {
                var beers = angular.fromJson(beersString);

                if( !Array.isArray(beers) ) {
                    newBeers.push(_Beer(0));
                    return newBeers;
                }

                // TODO: Remove this?
                // Nuke any beers without an id
                _.remove( beers, function(prop) {
                    if( typeof prop == "object" && prop ) {
                        return prop.id == null;
                    }
                    return true; // Not an object; what's it doing here??
                });

                return beers;
            }
            newBeers.push(_Beer(0));
            return newBeers;
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

        this.save = function( beerOrBeers ) {
            var beers = [];
            if( !Array.isArray(beerOrBeers) ) {
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
            var beers = _this.allBeers();
            _.remove( beers, function(prop) {
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