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
        $urlRouterProvider.otherwise('/app/dates');
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


DateMath = {
    /**
     * @param date A date string formatted as: YYYY-MM
     * @return {month: MM, year: YYYY}
     */
    getMonthAndYear: function(date) {
        var arrayVersion = date.split("-");

        var m = parseInt(arrayVersion[1]);
        var q = 0;
        if(m <= 3) {
            q = 1;
        } else if(m <= 6) {
            q = 2;
        } else if(m <= 9) {
            q = 3;
        } else {
            q = 4;
        }

        return {
            "year": parseInt(arrayVersion[0]),
            "month": m,
            "quarter": q
        };
    },

    getDrinkDate: function(beerObj) {
        return DateMath.addYears(beerObj.purchaseDate, beerObj.drinkAfterYears);
    },

    getQuarter: function(dateString) {
        return DateMath.getMonthAndYear(dateString).quarter;
    },

    /**
     * @param date A date string formatted as: YYYY-MM
     * @param years Int value, the number of years to be added
     * @return string A date string formatted as: YYYY-MM
     */
    addYears: function(date, years) {
        var monthAndYears = DateMath.getMonthAndYear(date);
        console.log("Adding " + years + " years to date " + date + ":", (monthAndYears.year + parseInt(years)) + "-" + monthAndYears.month);
        return (monthAndYears.year + parseInt(years)) + "-" + monthAndYears.month;
    },

    /**
     * @param date1 A date string formatted as: YYYY-MM
     * @param date2 A date string formatted as: YYYY-MM
     * @return number Negative if date1 comes before date2; positive if date2 comes before date1; zero if they are equal.
     */
    compare: function(date1, date2) {
        var monthAndYears1 = DateMath.getMonthAndYear(date1);
        var monthAndYears2 = DateMath.getMonthAndYear(date2);

        if(monthAndYears1.year < monthAndYears2.year) {
            return -1;
        } else if(monthAndYears1.year > monthAndYears2.year) {
            return 1;
        } else { // Years are equal; compare months
            if(monthAndYears1.month < monthAndYears2.month) {
                return -1;
            } else if(monthAndYears1.month > monthAndYears2.month) {
                return 1;
            } else {
                return 0;
            }
        }
    },

    /**
     * @param date1 A date string formatted as: YYYY-MM
     * @param date2 A date string formatted as: YYYY-MM
     * @return number Negative if date1's year comes before date2's year; positive if date2's year comes before date1's year; zero if they are in the same calendar year.
     */
    compareYear: function(date1, date2) {
        var monthAndYears1 = DateMath.getMonthAndYear(date1);
        var monthAndYears2 = DateMath.getMonthAndYear(date2);

        if(monthAndYears1.year < monthAndYears2.year) {
            return -1;
        } else if(monthAndYears1.year > monthAndYears2.year) {
            return 1;
        } else { // Years are equal; compare months
            return 0;
        }
    },
    /**
     * @param date1 A date string formatted as: YYYY-MM
     * @param date2 A date string formatted as: YYYY-MM
     * @return number Negative if date1's calendar quarter comes before date2's calendar quarter; positive if date2's calendar quarter comes before date1's calendar quarter; zero if they are in the same calendar quarter.
     */
    compareQuarter: function(date1, date2) {
        var monthAndYears1 = DateMath.getMonthAndYear(date1);
        var monthAndYears2 = DateMath.getMonthAndYear(date2);

        if(DateMath.compareYear(date1, date2) == 0) { // same year
            if(monthAndYears1.quarter < monthAndYears2.quarter) {
                return -1;
            } else if(monthAndYears1.quarter > monthAndYears2.quarter) {
                return 1;
            } else {
                return 0;
            }
        } else {
            return DateMath.compareYear(date1, date2);
        }
    }
};

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
    .filter('dates', function() {
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
    .filter('chunks', function() {
        /**
         * @param beerList array An ordered array of BeerService _Beer objects (likely ordered because you passed it through the date filter!)
         */
        return function(beerList) {
            var chunks = [];
            for(var i = 0; i < beerList.length; i++) {
                var isNewQuarter = false;
                if(i - 1 >= 0) {
                    var crntDrinkDate = DateMath.getDrinkDate(beerList[i]);
                    var prevDrinkDate = DateMath.getDrinkDate(beerList[i]);
                    isNewQuarter = DateMath.compareQuarter(crntDrinkDate, prevDrinkDate) !== 0;
                } else {
                    // We're looking at the first beer in the list
                    isNewQuarter = true;
                }

                if(isNewQuarter) {
                    chunks.push({
                        quarter: "Q" + DateMath.getQuarter(crntDrinkDate) + " " + DateMath.getMonthAndYear(crntDrinkDate).year,
                        beers: [beerList[i]]
                    });
                }
            }
            return chunks;
        };
    })
    .filter('style', function() {
        return function( beerList ) {
            return beerList;
        };
    });
