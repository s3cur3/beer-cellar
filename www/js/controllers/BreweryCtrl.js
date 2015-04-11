angular.module('BeerCellarApp.controllers.BreweryCtrl', [])
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
    }]);
