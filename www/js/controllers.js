
function backBtnIsVisible() {
    var btnFound = $(".back-button").length > 0;
    return $(".back-button").is(":visible") || (btnFound && $(".back-button.hide").length == 0);
}

var hideShowTimeouts = [];
function hideOrShowBackBtn() {
    var DEBUG_BACK_BTN = false;

    function hideOrShowBackBtnNonRecursive() {
        var menuBtn = $('ion-header-bar .left-buttons');
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

if(!runningOnDevice()) {
    // Need to stub out Cordova plugins
    angular.module('ngCordova', []).factory('$cordovaFile', function() { return {}; });
}


angular.module('BeerCellarApp.controllers', [])

    .controller('AppCtrl', ['$scope', '$kinvey', '$state', '$location', '$ionicModal', '$filter', 'BeerService', 'UserService', 'CameraFactory', function($scope, $kinvey, $state, $location, $ionicModal, $filter, BeerService, UserService, CameraFactory) {
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
        };


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
            $location.url('/sign-in');
            setTimeout(function(){
                console.error($location.path());
                $location.url('/sign-in');
            }, 1000);
        }


        console.log("Calling for initial update of beers");
        $scope.updateBeers(true).then(function() {
            console.log("Succeeded updating beers!");
        }, function(errorObj) {
            console.error("Failed to update beers initially!\n" + errorObj.name + ": " + errorObj.description, errorObj);
            if(errorObj.name === Kinvey.Error.DATABASE_ERROR) {
                console.log("Was a DB error");
            }
        });



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
                    console.log("user logout");
                    $kinvey.setActiveUser(null);
                    $state.go('signin');
                },
                function (error) {
                    //Kinvey logout finished with error
                    alert("Error logout: " + JSON.stringify(error));
                });
        };

        $scope.runningOnDevice = runningOnDevice;
    }])

    .controller('SignInCtrl', ['$scope', '$kinvey', '$state', 'UserService', function ($scope, $kinvey, $state, UserService) {
        console.log('Sign In Ctrl');
        $scope.redirectIfLoggedIn = function() {
            if(UserService.activeUser()) {
                console.log("Had active user!");
                $state.go("app.dates");
            } else {
                setTimeout($scope.redirectIfLoggedIn, 1000);
            }
        };

        setTimeout($scope.redirectIfLoggedIn, 500);


        $scope.signIn = function (user) {
            console.log('Sign In', user);

            UserService.login(user.username.toLowerCase(), user.password).then(function(response) {
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

            UserService.createUser(user.username.toLowerCase(), user.password).then(function(response) {
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

    .controller('SettingsCtrl', ['$scope', function($scope) {

    }])

    .controller('ExportCtrl', ['$scope', '$kinvey', '$state', 'UserService', function ($scope, $kinvey, $state, UserService) {
        $scope.exportCSV = function() {
            var tsv = "Beer Name\tBrewery\tVolume\tQuantity\tStyle\tPurchase Price\tPurchase Date\tDrink After (Years)\tDrink Before (Years)\tApp ID\n";
            for(var i = 0; i < $scope.beers.length; i++) {
                var beer = $scope.beers[i];
                var fields = [beer.name, beer.brewery, beer.volume, beer.quantity, beer.style, beer.purchasePrice, beer.purchaseDate, beer.drinkAfterYears, beer.drinkBeforeYears, beer._id];
                for(var j = 0; j < fields.length; j++) {
                    if(typeof fields[j] === "string")
                        fields[j] = fields[j].trim();
                }
                tsv += fields.join("\t") + "\n";
            }

            // Create the file from a data URI
            console.log("Creating download link");
            var pom = document.createElement('a');
            pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(tsv));
            pom.setAttribute('download', "beer-cellar.tsv");
            pom.click();
            $scope.success = true;
        };
    }])

    .controller('BeersCtrl', ['$scope', function($scope) {
        console.log("In BeersCtrl");
        hideOrShowBackBtn();
        $scope.updateBeers();

        // Update the master beer list right before we leave this controller
        $scope.$on('$locationChangeStart', function(event, next, current) {
            $scope.saveModifiedBeer();
        });
    }])

    .controller('BreweryCtrl', ['$scope', '$location', '$filter', function($scope, $location, $filter) {
        console.log("In BreweryCtrl");
        hideOrShowBackBtn();

        // Update the currently-in-use brewery when we load this one
        var re = /[^\/]+$/; // matches everything from the last / to the end of the string
        $scope.brewery = $location.url().match(re)[0];
        $scope.brewery = window.decodeURIComponent($scope.brewery);

        $scope.$watch('beersChunkedByStyle', function() {
            $scope.brewerysBeersChunkedByStyle = $scope.beersChunkedByStyle;
            for(var style in $scope.brewerysBeersChunkedByStyle)
            {
                if($scope.brewerysBeersChunkedByStyle.hasOwnProperty(style)) {
                    $scope.brewerysBeersChunkedByStyle[style] = _.filter($scope.brewerysBeersChunkedByStyle[style], function(beer) {
                        return beer.brewery && beer.brewery === $scope.brewery;
                    })
                }
            }
        });
    }])

    // Used in names.html
    .controller('BeerTypesCtrl', ['$scope', '$location', '$filter', function($scope, $location, $filter) {
        console.log("In BeerTypesCtrl");
        hideOrShowBackBtn();
        $scope.updateBeers();
    }])

    // Used in name.html
    .controller('BeerTypeCtrl', ['$scope', '$location', '$filter', function($scope, $location, $filter) {
        console.log("In BeerTypeCtrl");
        hideOrShowBackBtn();

        // Update the currently-in-use brewery when we load this one
        var re = /[^\/]+$/; // matches everything from the last / to the end of the string
        $scope.beerType = $location.url().match(re)[0];
        $scope.beerType = window.decodeURIComponent($scope.beerType);

        $scope.$watch('beers', function() {
            $scope.typesBeers = _.filter($scope.beers, function(beer) {
                return beer.name && beer.name === $scope.beerType;
            });
        });
    }])

    .controller('BeerCtrl', ['$scope', '$location', 'BeerService', function($scope, $location, BeerService) {
        console.log("In BeerCtrl");
        hideOrShowBackBtn();

        // Update the currently-in-use beer when we load this one
        var re = /[^\/]+$/; // matches everything from the last / to the end of the string
        var theID = $location.url().match(re)[0];

        console.log("Selecting beer", theID);
        BeerService.find(theID).then(function(beer) {
            console.log("Found it!");
            $scope.selectBeer(beer);
        }, function(err) {
                console.error("Error retrieving selected beer:", err);
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

