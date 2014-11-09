
function backBtnIsVisible() {
    var btnFound = $(".back-button").length > 0;
    return $(".back-button").is(":visible") || (btnFound && $(".back-button.ng-hide").length == 0);
}

var hideShowTimeouts = [];
function hideOrShowBackBtn() {
    var DEBUG_BACK_BTN = false;

    function hideOrShowBackBtnNonRecursive() {
        var menuBtn = $('.buttons.left-buttons');
        if( backBtnIsVisible() ) {
            if(DEBUG_BACK_BTN) console.log("back btn found");
            menuBtn.hide();
        } else {
            if(DEBUG_BACK_BTN) console.log("no back btn found");
            menuBtn.show();
        }
    }

    for( var i = 0; i < hideShowTimeouts.length; i++) clearTimeout(hideShowTimeouts[i]);
    hideShowTimeouts = [];

    hideOrShowBackBtnNonRecursive();
    var millisecondsToRunAt = [50, 100, 200, 400, 600, 800, 1000, 1200, 1800, 3200, 4000];
    for( var j = 0; j < millisecondsToRunAt.length; j++)
        hideShowTimeouts.push(window.setTimeout(hideOrShowBackBtnNonRecursive, millisecondsToRunAt[j]));
}

angular.module('BeerCellarApp.controllers', [])

    .controller('AppCtrl', ['$scope', '$kinvey', '$state', '$location', '$ionicModal', '$filter', 'BeerService', 'CameraFactory', function($scope, $kinvey, $state, $location, $ionicModal, $filter, BeerService, CameraFactory) {
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
         * @param {bool} [updateLastActive] Should we update $scope.beer? (Defaults to false)
         * @return {*} A promise to update the beers
         */
        $scope.updateBeers = function(updateLastActive) {
            return BeerService.all().then(function(allBeers) {
                console.log("Updated $scope.beers to:", allBeers);
                $scope.beers = allBeers;
                $scope.beersChunkedByDate = $scope.getDatesChunked();

                if(updateLastActive) {
                    BeerService.lastActive().then(function(b) {
                        $scope.beer = b;
                    });
                }
            });
        };

        $scope.saveModifiedBeer = function() {
            console.log("Saving $scope.beer...");
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
        };

        // Set up beer functionality
        $scope.beers = [];
        $scope.beer =  {};
        $scope.updateBeers(true);

        // Clean up Kinvey data
        //BeerService.clean();

        $scope.DateMath = DateMath;
        $scope.BeerService = BeerService;
        $scope.volumes = [
            "12 oz.",
            "16 oz.",
            "22 oz.",
            "750 mL",
            "40 oz."
        ];
        $scope.styles = [
            "IPA",
            "Double IPA",
            "Belgian IPA",
            "Stout",
            "Imperial Stout",
            "Scotch Ale",
            "Saison/Farmhouse Ale",
            "Belgian Blonde Ale",
            "Dubbel",
            "Tripel",
            "Quadruppel",
            "Barleywine",
            "Other"
        ];

        /**
         * Checks whether the indicated beer object is ready to drink or not
         * @param {Beer} [b] Optional: the beer object to check (defaults to the last accessed/modified beer)
         * @return {boolean} True if the beer is ready to drink; false otherwise.
         */
        $scope.greenLight = function(b) {
            if(!b) b = $scope.beer;

            if(b && b.purchaseDate && typeof b.drinkAfterYears === "number") {
                var drinkDateStr = DateMath.getDrinkDate(b);
                var thisMonth = DateMath.thisMonth();

                return DateMath.compare(thisMonth, drinkDateStr) >= 0;
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
                console.error("Failed to delete beer!");
            });
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
                    console.log("user logout");
                    $kinvey.setActiveUser(null);
                    $state.go('signin');
                },
                function (error) {
                    //Kinvey logout finished with error
                    alert("Error logout: " + JSON.stringify(error));
                });
        }
    }])

    .controller('SignInCtrl', ['$scope', '$kinvey', '$state', 'UserService', function ($scope, $kinvey, $state, UserService) {
        console.log('Sign In Ctrl');
        $scope.signIn = function (user) {
            console.log('Sign In', user);

            UserService.login(user.username, user.password).then(function(response) {
                    //Kinvey login finished with success
                    $scope.submittedError = false;
                    $state.go('app.dates');
                },
                function (error) {
                    //Kinvey login finished with error
                    $scope.submittedError = true;
                    $scope.errorDescription = error.description;
                    console.log("Error login " + error.description);//
                }
            );
        };
    }])

    .controller('SignUpCtrl', ['$scope', '$kinvey', '$state', 'UserService', function ($scope, $kinvey, $state, UserService) {
        $scope.createUser = function(user) {
            console.log('Sign Up', user);

            UserService.createUser(user.username, user.password).then(function(response) {
                    // Kinvey login finished with success
                    $scope.submittedError = false;
                    $state.go('app.dates');
                },
                function (error) {
                    //Kinvey login finished with error
                    $scope.submittedError = true;
                    $scope.errorDescription = error.description;
                    console.log("Error login " + error.description);//
                }
            );
        };
    }])

    .controller('BeersCtrl', ['$scope', '$location', 'BeerService', function($scope, $location, BeerService) {
        console.log("In BeersCtrl");
        hideOrShowBackBtn();

        $scope.addBeer = function() {
            console.log("Adding beer");
            BeerService.create().then(function(b) {
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

        // Update the master beer list right before we leave this controller
        $scope.$on('$locationChangeStart', function(event, next, current) {
            $scope.saveModifiedBeer();
        });
    }])

    .controller('BeerCtrl', ['$scope', '$location', 'BeerService', function($scope, $location, BeerService) {
        console.log("In BeerCtrl");
        hideOrShowBackBtn();

        // Update the currently-in-use beer when we load this one
        var re = /[^\/]+$/; // matches everything from the last / to the end of the string
        var theID = $location.url().match(re);

        console.log("Selecting beer", theID);
        BeerService.find(theID).then(function(beer) {
            console.log("Found it!");
            $scope.selectBeer(beer);
        });

        // Update the master beer list right before we leave this controller
        $scope.$on('$locationChangeStart', function(event, next, current) {
            $scope.saveModifiedBeer();
        });
    }])

    .controller('PhotoCtrl', ['$scope', 'CameraFactory', function($scope, CameraFactory) {
        $scope.getPhoto = function() {
            CameraFactory.getPicture().then(function(imageURI) {
                console.log(imageURI);

                if( !Array.isArray($scope.beer.images) ) $scope.beer.images = [];

                $scope.beer.images.push(imageURI);

            }, function(err) {
                console.err(err);
            });
        };
    }])



;

