angular.module('BeerCellarApp.controllers.BeerCtrl', [])
    .controller('BeerCtrl', ['$scope', '$location', 'BeerService', function($scope, $location, BeerService) {
        console.log("In BeerCtrl");
        hideOrShowBackBtn();

        // Update the currently-in-use beer when we load this one
        var re = /[^\/]+$/; // matches everything from the last / to the end of the string
        var theID = $location.url().match(re)[0];

        var foundBeerObj = BeerService.find(theID);
        if(foundBeerObj) {
            console.log("Selecting beer", foundBeerObj);
            $scope.selectBeer(beer);
        } else {
            console.error("Couldn't find requested beer in BeerCtrl");
        }

        // Update the master beer list right before we leave this controller
        $scope.$on('$locationChangeStart', function(event, next, current) {
            $scope.saveModifiedBeer();
        });
    }]);
