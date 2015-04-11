angular.module('BeerCellarApp.controllers.SignUpCtrl', [])
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
    }]);
