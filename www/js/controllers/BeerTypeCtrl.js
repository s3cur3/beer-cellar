angular.module('BeerCellarApp.controllers.BeerTypeCtrl', [])
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
    }]);
