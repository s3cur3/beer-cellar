var Styles = [
    "IPA",
    "Double IPA",
    "Belgian IPA",
    "Stout",
    "Imperial Stout",
    "Scotch Ale",
    "Saison/Farmhouse Ale",
    "Belgian Blonde Ale",
    "Sour/Wild Ale",
    "Dubbel",
    "Tripel",
    "Quadruppel",
    "Belgian (Other)",
    "Barleywine",
    "Rye Ale",
    "Strong Ale",
    "Old Ale",
    "Other"
];


// selects the desired state chnage behavior depending on whether the user is logged or not
function determineKinveyBehavior($window, activeUser) {
    if(activeUser === null || !activeUser) {
        console.log("Redirecting to signin");
        $window.location = 'sign-in';
    } else if($window.location.toString().indexOf('sign-in') > -1) {
        $window.location = 'app/dates';
    }
}

var deps = ['ionic', 'kinvey', 'ngCordova', 'BeerCellarApp.controllers', 'BeerCellarFilters', 'BeerCellarApp.services'];
var beerCellarApp = angular.module('BeerCellarApp', deps);

// Inject Kinvey MBaaS *before* the rest of the app is allowed to init
// (saves us from alllll sorts of race conditions in the controllers!)
var $injector = angular.injector(['ng', 'kinvey']);
$injector.invoke(["$kinvey", "$window", "$rootScope", function($kinvey, $window, $rootScope) {

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

        angular.bootstrap(document, ['BeerCellarApp']);

        uuid = activeUser.username;

        determineKinveyBehavior($window, activeUser);

        // Inform Kinvey when we go offline (so it can cache things locally)
        $(window).on({
            offline : $kinvey.Sync.offline,
            online  : $kinvey.Sync.online
        });

        // setup the stateChange listener
        $rootScope.$on("$stateChangeStart", function (event, toState) {
            if(toState.name !== 'signin') {
                console.log("Tried to change to non-signin state");
                determineKinveyBehavior($state, activeUser);
            }
        });
    }, function(errorCallback) {
        // Kinvey initialization finished with error
        console.log("Kinvey init with error: " + JSON.stringify(errorCallback));
        determineKinveyBehavior($window, activeUser);
    });
}]);

beerCellarApp
    .run(['$ionicPlatform', function ($ionicPlatform) {
        console.log("READY: Got Angular run() call");
        ionic.Platform.ready(function() {
            if(window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }

            console.log("READY: Launched on platform", ionic.Platform.platform());
            /*
             Set up file system variables

             Note:
             -	Android and IOS have other directorynames for files
             -	$cordovaFile functions prefixes all pathnames with root
             $cordovaFileTransfer functions needs absolute pathnames

             Create the prefixes for File functions and FileTransfer functions for Android and IOS
             */
            if(ionic.Platform.isAndroid()) {
                if(typeof inappbilling !== "undefined" && !g_billing_initialized) {
                    inappbilling.init(
                        function(resultInit) {
                            console.log("BILLING: Initialized");
                            g_billing_initialized = true;
                        },
                        function(errorInit) {
                            console.error("BILLING: Initialization error:", errorInit);
                        },
                        {showLog: true},
                        [PURCHASE_ID_ONE_MONTH, PURCHASE_ID_ONE_YEAR, PURCHASE_ID_LIFETIME]);
                } else {
                    console.error("BILLING: Got undefined inappbilling object");
                }
            }
            if(ionic.Platform.isIOS()) {

            }

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


            .state('app.settings', {
                url: "/settings",
                views: {
                    'menuContent': {
                        templateUrl: "templates/settings.html",
                        controller: 'SettingsCtrl'
                    }
                }
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

            .state('app.breweries', {
                url: "/breweries",
                views: {
                    'menuContent': {
                        templateUrl: "templates/breweries.html",
                        controller: 'BeersCtrl'
                    }
                }
            })

            .state('app.brewery', {
                url: "/breweries/:breweryName",
                views: {
                    'menuContent': {
                        templateUrl: "templates/brewery.html",
                        controller: 'BreweryCtrl'
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

            .state('app.beerTypes', {
                url: "/types",
                views: {
                    'menuContent': {
                        templateUrl: "templates/names.html",
                        controller: 'BeerTypesCtrl'
                    }
                }
            })

            .state('app.beerType', {
                url: "/types/:beerType",
                views: {
                    'menuContent': {
                        templateUrl: "templates/name.html",
                        controller: 'BeerTypeCtrl'
                    }
                }
            })

        ;
        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('app/dates?wtf');
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
                    '<input class="item-field" ng-class="{\'pseudo-hide\': !$parent.isEditable(label)}" ng-blur="$parent.clearEditable(label)" ng-focus="$parent.makeEditable(label)" type="number" class="right" ng-model="model">' +
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
                autocapitalize: '@',
                model: '=ngModel'
            },
            template:
                '<label class="input-text item">' +
                    '{{label}}' +
                    '<input type="text" ng-model="model" class="item-field" autocapitalize="{{autocapitalize}}">' +
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
                    '<span class="simulate-input item-field"><div ng-transclude></span>' +
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
                if(typeof beer1.purchaseDate === "string") {
                    console.log("Got a string date (that's wierd...). Obj was:", beer1);
                }
                if(typeof beer2.purchaseDate === "string") {
                    console.log("Got a string date (that's wierd...). Obj was:", beer2);
                }
                if(beer1.purchaseDate && beer2.purchaseDate && beer1.drinkAfterYears && beer2.drinkAfterYears) {
                    var date1 = DateMath.getDrinkDate(beer1);
                    var date2 = DateMath.getDrinkDate(beer2);
                    return DateMath.compare(date1, date2);
                } else {
                    return 0; // can't say anything about these two...
                }

            });
            return beerList;
        };
    })
    .filter('styles', function() {
        /**
         * @param beerList An array of BeerService _Beer objects
         * @param style {string} The style type you're interested in
         */
        return function(beerList, style) {
            var allEntriesForStyle = _.filter(beerList, function(beer) {
                return beer.style && (beer.style.trim() === style);
            });
            var beersByName = {};
            for(var i = 0; i < allEntriesForStyle.length; i++) {
                var beer = allEntriesForStyle[i];
                if(beersByName[beer.name])
                    beersByName[beer.name].push(beer);
                else
                    beersByName[beer.name] = [beer];
            }

            var out = [];
            for(var name in beersByName) {
                if(beersByName.hasOwnProperty(name)) {
                    var crntBeer = beersByName[name];
                    out.push({
                        name: name,
                        brewery: crntBeer[0].brewery,
                        quantity: _.reduce(crntBeer, function(all, crnt) { return all += (crnt.quantity || 1); }, 0),
                        purchaseDates: _.reduceRight(crntBeer, function(all, crnt) { return all.concat(crnt.purchaseDate); }, []),
                        drinkAfterYears: _.reduceRight(crntBeer, function(all, crnt) { return all.concat(crnt.drinkAfterYears); }, []),
                        _ids: _.reduceRight(crntBeer, function(all, crnt) { return all.concat(crnt._id); }, [])
                    });
                    if(out[out.length - 1].purchaseDates.length > 1) {
                        out[out.length - 1].href = '#/app/types/' + window.encodeURIComponent(out[out.length - 1].name);
                    } else {
                        out[out.length - 1].href = '#/app/beers/' + out[out.length - 1]._ids[0];
                    }
                }
            }
            return out;
        };
    })
    .filter('manyDrinkAfterYears', function() {
        return function(drinkAfterYearsList) {
            if(drinkAfterYearsList) {
                var max = 0;
                var min = 10000;
                for(var i = 0; i < drinkAfterYearsList.length; i++) {

                    var yearVal = drinkAfterYearsList[i];
                    if(yearVal > max) {
                        max = yearVal;
                    }
                    if(yearVal < min) {
                        min = yearVal;
                    }
                }

                if(max - 0.1 > min + 0.1)
                    return "" + min + " to " + max + " years";
                else
                    return "" + max + " years";
            } else {
                return "";
            }
        };
    })
    .filter('brewery', function() {
        /**
         * @param beerList An array of BeerService _Beer objects
         * @param brewery {string} The style type you're interested in
         */
        return function(beerList, brewery) {
            return _.filter(beerList, function(beer) {
                return beer.brewery && (beer.brewery.trim() === brewery);
            });
        };
    })
    .filter('dateString', function() {
        /**
         * @param date string A date string formatted as: YYYY-MM
         */
        return function(date) {
            assert(typeof date !== "string" && date, "dateString filter: Object " + date.toString() + " was not a date object.");

            var monthAndYear = DateMath.getMonthAndYear(date);
            var monthString = DateMath.monthNumberToString(monthAndYear.month);
            return monthString + " " + monthAndYear.year;
        };
    })
    .filter('drinkDate', function() {
        /**
         * @param beer A BeerService _Beer object
         */
        return function(beer) {
            if(Object.keys(beer).length > 0) {
                return DateMath.makeHumanReadable(DateMath.getDrinkDate(beer));
            } else {
                return "";
            }
        };
    })
    .filter('style', function() {
        return function( beerList ) {
            return beerList;
        };
    })
    .filter('escape', function() {
        return window.encodeURIComponent;
    });
