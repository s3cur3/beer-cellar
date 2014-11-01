function assert( testResult, optionalErrorMsg ) {
    if( !testResult ) {
        var errorStr = "ERROR";
        if( optionalErrorMsg ) {
            errorStr += ": " + optionalErrorMsg;
        }

        console.error( errorStr );
    }
}


angular.module('BeerCellarApp', ['ionic', 'BeerCellarApp.controllers', 'BeerCellarFilters', 'BeerCellarApp.services'])

    .run(function( $ionicPlatform ) {
        $ionicPlatform.ready(function() {
            if( window.StatusBar ) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }
        });
    })

    // Define our routes
    .config(function( $stateProvider, $urlRouterProvider ) {
        $stateProvider

            .state('app', {
                url: "/app",
                abstract: true,
                templateUrl: "templates/menu.html",
                controller: 'AppCtrl'
            })

            .state('app.criteria', {
                url: "/criteria",
                views: {
                    'menuContent': {
                        templateUrl: "templates/criteria.html",
                        controller: 'CriteriaCtrl'
                    }
                }
            })

            .state('app.properties', {
                url: "/properties",
                views: {
                    'menuContent': {
                        templateUrl: "templates/properties.html",
                        controller: 'PropertiesCtrl'
                    }
                }
            })

            .state('app.property', {
                url: "/properties/:propertyId",
                views: {
                    'menuContent': {
                        templateUrl: "templates/property.html",
                        controller: 'PropertyCtrl'
                    }
                }
            })

            .state('app.analysis', {
                url: "/properties/:propertyId/analysis",
                views: {
                    'menuContent': {
                        templateUrl: "templates/analysis.html",
                        controller: 'AnalysisCtrl'
                    }
                }
            })

            .state('app.financing', {
                url: "/properties/:propertyId/financing",
                views: {
                    'menuContent': {
                        templateUrl: "templates/financing.html",
                        controller: 'FinancingCtrl'
                    }
                }
            })

            .state('app.proForma', {
                url: "/properties/:propertyId/pro-forma",
                views: {
                    'menuContent': {
                        templateUrl: "templates/pro-forma.html",
                        controller: 'ProFormaCtrl'
                    }
                }
            })

        ;
        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/app/properties');
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


angular.module('RealEstateFilters', [])
    .filter('percent', function() {
        return function( input ) {
            var rounded = Math.round(input * 10000) / 100;
            if( isNaN(rounded) ) {
                return '';
            }
            return '' + rounded + '%';
        };
    });
