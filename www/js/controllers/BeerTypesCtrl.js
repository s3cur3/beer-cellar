angular.module('BeerCellarApp.controllers.BeerTypesCtrl', [])
    // Used in names.html
    .controller('BeerTypesCtrl', ['$scope', '$location', '$filter', function($scope, $location, $filter) {
        console.log("In BeerTypesCtrl");
        hideOrShowBackBtn();
        $scope.updateBeers();
    }]);
