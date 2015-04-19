angular.module('BeerCellarApp.controllers.InitPurchaseCtrl', [])
    .controller('InitPurchaseCtrl', ['$scope', '$kinvey', '$state', 'UserService', function($scope, $kinvey, $state, UserService) {
        $scope.restorePurchase = $scope.doCheckSubscriptions;

        window.localStorage[STORAGE_KEY_LOCAL_ONLY] = FALSE;
        if(ionic.Platform.isAndroid()) {

        } else if(ionic.Platform.isIOS()) {
            // TODO: iOS Billing
        } else {
            alert("Purchasing not supported!!");
        }
    }]);
