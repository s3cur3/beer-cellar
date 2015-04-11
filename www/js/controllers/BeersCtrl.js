angular.module('BeerCellarApp.controllers.BeersCtrl', [])
    .controller('BeersCtrl', ['$scope', function($scope) {
        console.log("In BeersCtrl");
        hideOrShowBackBtn();
        $scope.updateBeers();

        // Update the master beer list right before we leave this controller
        $scope.$on('$locationChangeStart', function(event, next, current) {
            $scope.saveModifiedBeer();
        });
    }]);
