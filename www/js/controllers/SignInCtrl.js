angular.module('BeerCellarApp.controllers.SignInCtrl', [])
    .controller('SignInCtrl', ['$scope', '$kinvey', '$state', 'UserService', function ($scope, $kinvey, $state, UserService) {
        console.log('Sign In Ctrl');
        setTimeout($scope.redirectIfLoggedIn, 500);

        $scope.signIn = function (user) {
            console.log('Sign In', user);

            UserService.login(user.username.toLowerCase(), user.password).then(function(response) {
                    //Kinvey login finished with success
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
