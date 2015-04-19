angular.module('BeerCellarApp.controllers.AppInitCtrl', [])
    .controller('AppInitCtrl', ['$scope', '$kinvey', '$state', 'UserService', function($scope, $kinvey, $state, UserService) {
        console.log('App Init Ctrl');
        $scope.wantsPurchase = function() {
            console.log("User indicated they want to purchase");
            $state.go("purchase");
        };


        $scope.doCheckSubscriptions();

        $scope.redirectIfLoggedIn = function() {
            if(UserService.activeUser()) {
                console.log("Had active user!");
                $state.go("app.dates");
            } else {
                setTimeout($scope.redirectIfLoggedIn, 1000);
            }
        };
        setTimeout($scope.redirectIfLoggedIn, 500);
    }]);
