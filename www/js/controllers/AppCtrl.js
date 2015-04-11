angular.module('BeerCellarApp.controllers.AppCtrl', [])
    .controller('AppCtrl', ['$scope', '$kinvey', '$state', '$location', '$ionicModal', '$filter', 'BeerService', 'UserService', function($scope, $kinvey, $state, $location, $ionicModal, $filter, BeerService, UserService) {
        $scope._buy = function(productID) {
            if(ionic.Platform.isAndroid() && typeof inappbilling !== "undefined") {
                inappbilling.buy(function(data) {
                        console.log("BILLING: purchased " + productID);
                    }, function(errorBuy) {
                        console.error("BILLING: Error purchasing " + productID, errorBuy);
                    },
                    productID);
            } else {
                console.error("Buying not supported.");
                console.error("Platform is Android:", ionic.Platform.isAndroid());
                console.error("IAB:", inappbilling);
            }
        };
        $scope.buyOneMonthSubscription = function() { $scope._buy(PURCHASE_ID_ONE_MONTH); };
        $scope.buyOneYearSubscription = function() { $scope._buy(PURCHASE_ID_ONE_YEAR); };
        $scope.buyLifetime = function() { $scope._buy(PURCHASE_ID_LIFETIME); };

        $scope.getDatesChunked = function() {
            var chunks = [];

            var sizeBefore = $scope.beers.length;
            $scope.beers = $filter('sortDates')($scope.beers);
            assert(sizeBefore === $scope.beers.length);

            for(var i = 0; i < $scope.beers.length; i++) {
                var isNewQuarter = false;
                var thisBeer = $scope.beers[i];
                var prevBeer = $scope.beers[i - 1];

                var crntDrinkDate;
                if(thisBeer.purchaseDate && thisBeer.drinkAfterYears) {
                    crntDrinkDate = DateMath.getDrinkDate($scope.beers[i]);
                } else {
                    crntDrinkDate = DateMath.thisMonth();
                }

                if(i - 1 >= 0) {
                    var prevDrinkDate;
                    if(prevBeer.purchaseDate && prevBeer.drinkAfterYears) {
                        prevDrinkDate = DateMath.getDrinkDate($scope.beers[i - 1]);
                    } else {
                        prevDrinkDate = DateMath.thisMonth();
                    }
                    isNewQuarter = DateMath.compareQuarter(crntDrinkDate, prevDrinkDate) !== 0;
                } else {
                    // We're looking at the first beer in the list
                    isNewQuarter = true;
                }

                if(isNewQuarter) {
                    chunks.push({
                        quarter: "Q" + DateMath.getQuarter(crntDrinkDate) + " " + DateMath.getMonthAndYear(crntDrinkDate).year,
                        beers: [$scope.beers[i]]
                    });
                } else {
                    chunks[chunks.length -1].beers.push($scope.beers[i]);
                }
            }

            var count = 0;
            for(i = 0; i < chunks.length; i++) {
                count += chunks[i].beers.length;
            }
            assert($scope.beers.length == count);

            return chunks;
        };

        $scope.getStylesChunked = function(optionalBeerListToUse) {
            var out = {};
            for(var i = 0; i < $scope.styles.length; i++) {
                var style = $scope.styles[i];
                out[style] = $filter('styles')(optionalBeerListToUse || $scope.beers, style);
            }
            return out;
        };

        $scope.getBreweriesChunked = function() {
            var breweriesSet = {}; // {"someBrewery": true}
            for(var i = 0; i < $scope.beers.length; i++) {
                breweriesSet[$scope.beers[i].brewery.trim()] = true;
            }

            var out = {};
            for(var brewery in breweriesSet) {
                if(breweriesSet.hasOwnProperty(brewery) && breweriesSet[brewery]) {
                    out[brewery] = [];
                    for(i = 0; i < $scope.beers.length; i++) {
                        if($scope.beers[i].brewery.trim() === brewery)
                            out[brewery].push($scope.beers[i])
                    }
                }
            }
            return out;
        };

        $scope.getNamesChunked = function() {
            var namesSet = {}; // {"some beer": true}
            for(var i = 0; i < $scope.beers.length; i++) {
                namesSet[$scope.beers[i].name.trim()] = true;
            }

            var out = {};
            for(var name in namesSet) {
                if(namesSet.hasOwnProperty(name) && namesSet[name]) {
                    out[name] = [];
                    for(i = 0; i < $scope.beers.length; i++) {
                        if($scope.beers[i].name.trim() === name)
                            out[name].push($scope.beers[i])
                    }
                }
            }
            return out;
        };

        /**
         * Synchronously selects the last active beer
         * @param theBeer {Beer} The beer object to select as the last active one
         */
        $scope.selectBeer = function(theBeer) {
            console.log("Selecting beer", theBeer);
            $scope.beer = theBeer;
            return BeerService.setLastActiveBeer(theBeer);
        };

        /**
         * @param {boolean} [updateLastActive] Should we update $scope.beer? (Defaults to false)
         * @return {*} A promise to update the beers
         */
        $scope.updateBeers = function(updateLastActive) {
            console.log("$scope.updateBeers()");
            return BeerService.all().then(function(allBeers) {
                console.log("Updated $scope.beers to:", allBeers);
                $scope.beers = allBeers;

                $scope.beersChunkedByDate = $scope.getDatesChunked();
                console.log("Chunked by date:", $scope.beersChunkedByDate);

                $scope.beersChunkedByStyle = $scope.getStylesChunked();
                console.log("Chunked by style:", $scope.beersChunkedByStyle);

                $scope.beersChunkedByName = $scope.getNamesChunked();
                console.log("Chunked by name:", $scope.beersChunkedByName);

                $scope.beersChunkedByBrewery = $scope.getBreweriesChunked();
                console.log("Chunked by brewery:", $scope.beersChunkedByBrewery);

                $scope.knownBreweries = Object.keys($scope.beersChunkedByBrewery).sort();
                $scope.knownBeerNames = Object.keys($scope.beersChunkedByName).sort();

                if(updateLastActive) {
                    BeerService.lastActive().then(function(b) {
                        $scope.beer = b;
                    });
                }

                // Update our stats
                $scope.stats.bottles = 0;
                $scope.stats.meanYears = 0;
                for(var i = 0; i < $scope.beers.length; i++) {
                    var b = $scope.beers[i];
                    $scope.stats.bottles += b.quantity;
                    $scope.stats.meanYears += b.drinkAfterYears;
                }
                $scope.stats.meanYears = $scope.stats.meanYears / $scope.beers.length;
                $scope.stats.names = Object.keys($scope.beersChunkedByName).length;
                $scope.stats.breweries = Object.keys($scope.beersChunkedByBrewery).length;
                $scope.stats.entries = $scope.beers.length;
            });
        };

        $scope.addBeer = function(optionalBeerToClone) {
            console.log("Adding beer");
            if(optionalBeerToClone) console.log("Clone of:", optionalBeerToClone);
            BeerService.create(optionalBeerToClone).then(function(b) {
                $scope.selectBeer(b); // synchronous
                $scope.updateBeers().then(function() {
                    BeerService.lastActive().then(function(beer) {
                        console.log("Setting path to /#/beers/" + beer._id);
                        $scope.beer = beer;
                        $location.path('app/beers/' + beer._id);
                    });
                });
            });
        };

        $scope.navigateToBrewery = function(brewery) {
            $location.path('app/breweries/' + brewery);
        };


        $scope.navigateToBeerType = function(name) {
            $location.path('app/types/' + name);
        };

        $scope.saveModifiedBeer = function() {
            if($scope.activeUser) {
                console.log("Saving $scope.beer...", $scope.beer);
                assert(typeof $scope.beer === "object");

                if($scope.beer && $scope.beer.name && $scope.beer.name != "New beer") {
                    BeerService.save($scope.beer).then(function(beer) {
                        console.log("Saved beer from promise is:", beer);
                        $scope.beer = beer;
                        $scope.updateBeers();
                    }, function() {
                        console.log("Failed to save beer! Trying again...");
                        $scope.saveModifiedBeer();
                    });
                }
            }
        };


        $scope.activeUser = null;

        $scope.beers = [];
        $scope.beer =  {};

        $scope.DateMath = DateMath;
        $scope.BeerService = BeerService;
        $scope.volumes = [
            "12 oz.",
            "16 oz.",
            "22 oz.",
            "750 mL",
            "40 oz."
        ];
        $scope.styles = Styles;
        $scope.stats = {
            bottles: 0,
            names: 0,
            entries: 0,
            breweries: 0,
            meanYears: 0
        };


        // Check that we're signed in
        if(!UserService.activeUser()) {
            console.error("Not logged in!");
            $location.url('/init');
            setTimeout(function(){
                console.error($location.path());
                $location.url('/init');
            }, 1000);
        }

        $scope.tryUpdatingActiveUser = function() {
            console.log("Attempting to update $scope.activeUser");
            if(!$scope.activeUser) {
                $scope.activeUser = UserService.activeUser();
            }
            if(!$scope.activeUser) {
                setTimeout($scope.tryUpdatingActiveUser, 2000);
            }
        };
        $scope.tryUpdatingActiveUser();


        console.log("Calling for initial update of beers");
        $scope.updateBeers(true).then(function() {
            console.log("Succeeded updating beers!");
        }, function(errorObj) {
            console.error("Failed to update beers initially!\n" + errorObj.name + ": " + errorObj.description, errorObj);
            if(errorObj.name === Kinvey.Error.DATABASE_ERROR) {
                console.log("Was a DB error");
            }
        });


        // Set up purchases
        $scope.getPurchases = function() {
            if(ionic.Platform.isAndroid() && typeof inappbilling !== "undefined" && g_billing_initialized) {
                inappbilling.getPurchases(
                    function(result) {
                        console.log("BILLING: Purchases retrieved:", result);
                    },
                    function(errorPurchases) {
                        console.error("BILLING: Purchase retrieval error:", errorPurchases);
                    });
            } else {
                console.error("Couldn't load in-app billing plugin");
            }
        };
        function tryPurchases() {
            if(g_billing_initialized) {
                $scope.getPurchases()
            } else {
                console.log("Billing not yet initialized...");
                setTimeout(tryPurchases, 5000)
            }
        }
        tryPurchases();


        /**
         * Checks whether the indicated beer object is ready to drink or not
         * @param {Beer} [b] Optional: the beer object to check (defaults to the last accessed/modified beer)
         * @return {boolean} True if the beer is ready to drink; false otherwise.
         */
        $scope.greenLight = function(b) {
            if(!b) b = $scope.beer;

            if(b && b.purchaseDate && typeof b.drinkAfterYears === "number") {
                var drinkDate = DateMath.getDrinkDate(b);
                var thisMonth = DateMath.thisMonth();

                return DateMath.compare(thisMonth, drinkDate) >= 0;
            } else { // beers apparently haven't been set from the DB yet
                return false;
            }
        };


        // Functionality for the Delete Modal
        $ionicModal.fromTemplateUrl('delete.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal){
            $scope.deleteModal = modal;
        });

        // Tools for deleting a beer
        $scope.delete = function(p) {
            $scope.beerToDelete = p;
            $scope.deleteModal.show();
        };
        $scope._delete = function() {
            $scope.deleteModal.hide();
            BeerService.remove($scope.beerToDelete).then(function() {
                $scope.updateBeers(true);
                $scope.beer = {};
                $location.path('app/dates');
            }, function() {
                console.error("Failed to delete beer!", $scope.beerToDelete);
            });
        };
        // No popup, just do the deletion
        $scope.seriouslyDelete = function(beer) {
            $scope.beerToDelete = beer;
            $scope._delete();
        };
        $scope.closeDelete = function() {
            $scope.deleteModal.hide();
        };

        // Flags for dealing with editable text fields
        $scope.makeEditable = function(labelForField) {
            $scope.editable = labelForField;
        };
        $scope.isEditable = function(labelForField) {
            return $scope.editable === labelForField;
        };
        $scope.clearEditable = function(label) {
            if($scope.editable == label) // Don't touch it if this field isn't being edited currently!
                $scope.editable = null;
        };

        $scope.logout = function () {
            console.log("logout");

            //Kinvey logout starts
            $kinvey.User.logout().then(
                function () {
                    //Kinvey logout finished with success
                    $kinvey.setActiveUser(null);
                    $scope.activeUser = null;
                    $state.go('init');
                },
                function (error) {
                    //Kinvey logout finished with error
                    alert("Error logout: " + JSON.stringify(error));
                });
        };

        $scope.runningOnDevice = runningOnDevice;
    }]);
