
// selects the desired state chnage behavior depending on whether the user is logged or not
function determineKinveyBehavior($state, activeUser) {
    if(activeUser === null) {
        console.log("Redirecting to signin");
        $state.go('signin');
    } else if($state.current.name === 'sign-in') {
        $state.go('app.dates');
    }
}


angular.module('BeerCellarApp', ['ionic', 'kinvey', 'BeerCellarApp.controllers', 'BeerCellarFilters', 'BeerCellarApp.services'])

    .run(['$ionicPlatform', '$kinvey', '$rootScope', '$state', "$window", 'UserService', function ($ionicPlatform, $kinvey, $rootScope, $state, $window, UserService) {
        $ionicPlatform.ready(function() {
            if(window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }

            // Initialize Kinvey MBaaS
            $kinvey.init({
                appKey: 'kid_b1l19t0ZU',
                appSecret: '173b833d9a1e4577a935cb7847767044',
                refresh: true,
                sync: {
                    enable: true,
                    online : $window.navigator.onLine // set initial state
                }
            }).then(function(activeUser) {
                // Kinvey initialization finished with success
                console.log("Kinvey init with success. Active user is:", activeUser);
                determineKinveyBehavior($state, activeUser);

                // setup the stateChange listener
                $rootScope.$on("$stateChangeStart", function (event, toState /*, toParams, fromState, fromParams*/) {
                    if(toState.name !== 'signin') {
                        console.log("Tried to change to non-signin state");
                        determineKinveyBehavior($state, activeUser);
                    }
                });

                // Inform Kinvey when we go offline (so it can cache things locally)
                $(window).on({
                    offline : $kinvey.Sync.offline,
                    online  : $kinvey.Sync.online
                });
            }, function(errorCallback) {
                // Kinvey initialization finished with error
                console.log("Kinvey init with error: " + JSON.stringify(errorCallback));
                determineKinveyBehavior($state, activeUser);
            });
        });
    }])

    // Define our routes
    .config(function( $stateProvider, $urlRouterProvider ) {
        $stateProvider

            .state('app', {
                url: "/app",
                abstract: true,
                templateUrl: "templates/menu.html",
                controller: 'AppCtrl'
            })

            .state('signin', {
                url: "/sign-in",
                templateUrl: "templates/sign-in.html",
                controller: 'SignInCtrl'
            })

            .state('signup', {
                url: "/sign-up",
                templateUrl: "templates/sign-up.html",
                controller: 'SignUpCtrl'
            })

            .state('app.styles', {
                url: "/styles",
                views: {
                    'menuContent': {
                        templateUrl: "templates/styles.html",
                        controller: 'BeersCtrl'
                    }
                }
            })

            .state('app.dates', {
                url: "/dates",
                views: {
                    'menuContent': {
                        templateUrl: "templates/dates.html",
                        controller: 'BeersCtrl'
                    }
                }
            })

            .state('app.beer', {
                url: "/beers/:beerId",
                views: {
                    'menuContent': {
                        templateUrl: "templates/beer.html",
                        controller: 'BeerCtrl'
                    }
                }
            })

        ;
        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/sign-in');
    })

    .config(function($compileProvider){
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel):/); // allow image urls from the camera factory
    })

    .directive('group', function() {
        return {
            restrict: 'E', // must be an HTML element
            transclude: true,
            replace: true,
            scope: { label: '@' },
            template: '<section><div class="item item-divider">{{label}}</div><div ng-transclude></group>'
        };
    })
    .directive('numberField', function($compile) {
        return {
            restrict: 'E', // must be an HTML element
            replace: true,
            scope: {
                label: '@',
                prefix: '@',
                suffix: '@',
                model: '=ngModel',
                isEditable: '&'
            },
            template:
                '<label class="item" ng-click="$parent.makeEditable(label)">' +
                    '{{label}}' +
                    '<span class="item-field" ng-show="!$parent.isEditable(label)">{{prefix}}{{model}} {{suffix}}</span>' +
                    '<input class="item-field" ng-show="$parent.isEditable(label)" ng-blur="$parent.clearEditable(label)" type="number" class="right" ng-model="model">' +
                '</number-field>'
        };
    })
    .directive('monthField', function($compile) {
        return {
            restrict: 'E', // must be an HTML element
            replace: true,
            scope: {
                label: '@',
                prefix: '@',
                suffix: '@',
                model: '=ngModel',
                isEditable: '&'
            },
            template:
                '<label class="item item-input">' +
                    '<span class="input-label">' +
                        '{{label}}' +
                    '</span>' +
                    '<input class="item-field" type="month" class="right" ng-model="model">' +
                '</number-field>'
        };
    })
    .directive('textField', function() {
        return {
            restrict: 'E', // must be an HTML element
            replace: true,
            transclude: true,
            scope: {
                label: '@',
                model: '=ngModel'
            },
            template:
                '<label class="input-text item">' +
                    '{{label}}' +
                    '<input type="text" ng-model="model" class="item-field">' +
                '</input-text>'
        };
    })
    .directive('calculatedField', function() {
        return {
            restrict: 'E', // must be an HTML element
            replace: true,
            transclude: true,
            scope: {
                label: '@',
                prefix: '@',
                suffix: '@',
                model: '=ngModel'
            },
            template:
                '<label class="input-number item simulate-input-container">' +
                    '{{label}}' +
                    '<span class="simulate-input item-field" id="allInPrice"><div ng-transclude></span>' +
                '</calculated-field>'
        };
    })
;


angular.module('BeerCellarFilters', [])
    .filter('percent', function() {
        return function(input) {
            var rounded = Math.round(input * 10000) / 100;
            if( isNaN(rounded) ) {
                return '';
            }
            return '' + rounded + '%';
        };
    })
    .filter('sortDates', function() {
        /**
         * @param beerList An array of BeerService _Beer objects
         */
        return function(beerList) {
            beerList.sort(function(beer1, beer2) {
                var date1 = DateMath.getDrinkDate(beer1);
                var date2 = DateMath.getDrinkDate(beer2);
                return DateMath.compare(date1, date2);
            });
            return beerList;
        };
    })
    .filter('dateString', function() {
        /**
         * @param date string A date string formatted as: YYYY-MM
         */
        return function(date) {
            var monthAndYear = DateMath.getMonthAndYear(date);
            var monthString = DateMath.monthNumberToString(monthAndYear.month);
            return monthString + " " + monthAndYear.year;
        };
    })
    .filter('style', function() {
        return function( beerList ) {
            return beerList;
        };
    });
