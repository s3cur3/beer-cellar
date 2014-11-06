
function backBtnIsVisible() {
    var btnFound = $(".back-button").length > 0;
    return $(".back-button").is(":visible") || (btnFound && $(".back-button.ng-hide").length == 0);
}

var hideShowTimeouts = [];
function hideOrShowBackBtn() {
    function hideOrShowBackBtnNonRecursive() {
        var menuBtn = $('.buttons.left-buttons');
        if( backBtnIsVisible() ) {
            console.log("back btn found");
            menuBtn.hide();
        } else {
            console.log("no back btn found");
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

    .controller('AppCtrl', ['$scope', '$location', '$ionicModal', '$filter', 'BeerService', 'CameraFactory', function( $scope, $location, $ionicModal, $filter, BeerService, CameraFactory ) {
        $scope.getDatesChunked = function() {
            var chunks = [];

            var sizeBefore = $scope.beers.length;
            $scope.beers = $filter('sortDates')($scope.beers);
            assert(sizeBefore === $scope.beers.length);

            for(var i = 0; i < $scope.beers.length; i++) {
                var isNewQuarter = false;
                var crntDrinkDate = DateMath.getDrinkDate($scope.beers[i]);

                if(i - 1 >= 0) {
                    var prevDrinkDate = DateMath.getDrinkDate($scope.beers[i - 1]);
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


        // Set up beer functionality
        $scope.DateMath = DateMath;
        $scope.BeerService = BeerService;
        $scope.beers = BeerService.allBeers();
        $scope.beer = $scope.beers[ BeerService.getLastActiveIndex() ];
        $scope.beersChunkedByDate = $scope.getDatesChunked();
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


        $scope.selectBeer = function(prop, index) {
            $scope.beer = prop;
            BeerService.setLastActiveIndex(index || prop);
        };

        $scope.greenLight = function(b) {
            if (!b) b = $scope.beer;

            var drinkDateStr = DateMath.getDrinkDate(b);
            var thisMonth = DateMath.thisMonth();

            return DateMath.compare(thisMonth, drinkDateStr) >= 0;
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
            BeerService.delete($scope.beerToDelete);
            $scope.beers = BeerService.allBeers();
            $location.path('/beers');
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

        // Update the master beer list whenever we modify this beer
        $scope.$watch('beer', function(updatedBeer, oldBeer) {
            if( typeof updatedBeer == "object" && updatedBeer ) {
                BeerService.save(updatedBeer);
                $scope.beers = BeerService.allBeers();
                $scope.beersChunkedByDate = $scope.getDatesChunked();
            } else {
                console.log("Got empty beer in an update...?");
            }
        }, true);
    }])

    .controller('BeersCtrl', ['$scope', '$location', 'BeerService', function($scope, $location, BeerService) {
        console.log("In BeersCtrl");
        hideOrShowBackBtn();

        $scope.beers = BeerService.allBeers();
        if( $scope.beers.length == 0 ) {
            $scope.beer = BeerService.newBeer();
            $scope.beers = BeerService.allBeers();
        }

        $scope.addBeer = function() {
            console.log("Adding beer");
            var b = BeerService.newBeer();
            $scope.beers = BeerService.allBeers();
            $scope.selectBeer(b);

            console.log("Setting path to " + '/beers/' + BeerService.getLastActiveIndex());
            $location.path('/#/beers/' + BeerService.getLastActiveIndex());
        }
    }])

    .controller('BeerCtrl', ['$scope', '$location', 'BeerService', function($scope, $location, BeerService) {
        console.log("In BeerCtrl");
        hideOrShowBackBtn();

        // Update the currently-in-use beer when we load this one
        var re = /[0-9]+$/;
        var id = $location.url().match(re);
        $scope.selectBeer( BeerService.getBeerByID(id) );
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

