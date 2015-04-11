angular.module('BeerCellarApp.controllers.AppInitCtrl', [])
    .controller('AppInitCtrl', ['$scope', '$kinvey', '$state', 'UserService', function($scope, $kinvey, $state, UserService) {
        console.log('App Init Ctrl');
        $scope.StateType = {
            OFFER_SUBSCRIPTION: 1,
            WANTS_LOCAL_ONLY: 2,
            WANTS_PURCHASE: 3,
            SUBSCRIPTION_FOUND: 4,
            GETS_SYNCED_MODE: 5,
            NEEDS_LOGIN: 6,
            RESTORE_PURCHASE: 7,
            NEW_PURCHASE: 8
        };
        $scope.wantsLocalOnly = function() {
            g_local_account_only = true;
            $state.go("app.dates");
        };
        $scope.wantsPurchase = function() {
            $state.go("app.purchase");
        };

        $scope.doCheckSubscriptions = function () {
            checkSubscriptions().then(
                function(ownedProductsArray) {
                    if(ownedProductsArray.length > 0) {
                        console.log("USER HAS SUBSCRIPTION");
                        $scope.advanceState($scope.StateType.SUBSCRIPTION_FOUND);
                    }
                }
            );
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
