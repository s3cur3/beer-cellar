
angular.module('BeerCellarApp.services', [])

    .service('PropertyService', function() {
        var _Property = function(newID) {
            if( typeof newID === "undefined" ) newID = _this._getNextID();

            return {
                id: newID,
                basics: {
                    name: "New property"
                },

                images: [],

                initial: {
                    purchasePrice: 0,
                    repairsAndImprovements: 0
                },
                value: {
                    appraisedValue: 0
                },

                // Income
                income : {
                    grossMonthlyRentalIncome: 0,
                    otherMonthlyIncome: 0
                },
                totalAnnualOperatingIncome: 0,

                // Expenses
                expenses: {
                    vacancyRateLoss: 10,
                    annualPropertyTax: 0,
                    annualInsurance: 0,
                    propertyManagementPercent: 0,
                    maintenancePercent: 10,
                    miscMonthlyExpenses: 0
                },
                totalAnnualOperatingExpenses: 2672.00,

                // Investment stats
                loan: {
                    interestRate: 6.0,
                    termYears: 15,
                    downPaymentPercent: 20
                }
            }
        };

        this._getNextID = function() {
            var all = _this.allProperties();

            var id;
            if( all.length > 0 ) {
                id = all[ all.length - 1 ].id + 1;
                console.log("Found ID to be " + id);
            } else {
                id = 0;
                console.log("No known properties!");
                console.log(all);
            }

            return id;
        };

        this.newProperty = function() {
            var prop = _Property();
            console.log("Created new property with ID " + prop.id);
            _this.save(prop);

            _this.setLastActiveIndex(prop.id);
            return  prop;
        };

        this.getPropertyByID = function(id) {
            var properties = _this.allProperties();


            if( properties.length > 0 ) {
                for( var i = 0; i < properties.length; i++ ) {
                    if( properties[i].id == id ) {
                        return properties[i];
                    }
                }

                console.error("ERROR: Couldn't find property " + id);
                return properties[0];
            }
            return _this.newProperty();
        };

        this.allProperties = function() {
            // TODO: This is RIDICULOUSLY inefficient --- it's called all the damn time!
            var propertiesString = window.localStorage['properties'];
            var newProperties = [];
            if( propertiesString ) {
                var properties = angular.fromJson(propertiesString);

                if( !Array.isArray(properties) ) {
                    newProperties.push(_Property(0));
                    return newProperties;
                }

                // TODO: Remove this?
                // Nuke any properties without an id
                _.remove( properties, function(prop) {
                    if( typeof prop == "object" && prop ) {
                        return prop.id == null;
                    }
                    return true; // Not an object; what's it doing here??
                });

                return properties;
            }
            newProperties.push(_Property(0));
            return newProperties;
        };

        /**
         * If property already exists in the list of properties, it will
         * be updated. If it does not exist, we will append it.
         * @param property {*}
         * @param properties Array
         * @returns Array The updated properties array
         * @private
         */
        this._addPropertyToProperties = function( property, properties ) {
            var foundProperty = false;
            for( var i = 0; i < properties.length; i++ ) {
                if( properties[i].id === property.id ) {
                    foundProperty = true;
                    properties[i] = property;
                    break;
                }
            }

            if( !foundProperty ) {
                properties.push(property);
            }

            return properties;
        };

        this._orderProperties = function( properties ) {
            function sortByID(a, b){
                return ((a.id < b.id) ? -1 : ((a.id > b.id) ? 1 : 0));
            }

            properties.sort(sortByID);
            return properties;
        };

        this.save = function( propertyOrProperties ) {
            var properties = [];
            if( !Array.isArray(propertyOrProperties) ) {
                properties = _this.allProperties();

                var property = propertyOrProperties;
                assert( typeof property == "object", "Property is not an object" );
                properties =  _this._addPropertyToProperties( property, properties );
            } else {
                properties = propertyOrProperties;
            }

            properties = _this._orderProperties(properties);

            // TODO: make this more efficient?
            window.localStorage['properties'] = angular.toJson(properties);
        };

        this.delete = function( property ) {
            var properties = _this.allProperties();
            _.remove( properties, function(prop) {
                return prop.id == property.id;
            });
            _this.save(properties);
        };

        this.getLastActiveIndex = function() {
            var lastActive = window.localStorage['lastActiveProperty'];
            if( lastActive === undefined ||
                lastActive == null ||
                lastActive == "undefined" ) {
                lastActive = -1;
            }
            return parseInt(lastActive);
        };

        this.setLastActiveIndex = function( indexOrProperty ) {
            if( typeof indexOrProperty == "number" ) {
                window.localStorage['lastActiveProperty'] = indexOrProperty;
            } else {
                window.localStorage['lastActiveProperty'] = _this._getIndexOfProperty(indexOrProperty);
            }

        };

        this._getIndexOfProperty = function( prop ) {
            assert(typeof prop == "object", "Sought property is not a valid property object.");

            var all = _this.allProperties();
            for( var i = 0; i < all.length; i++ ) {
                if( all[i].id == prop.id ) {
                    return i;
                }
            }
            return -1;
        };

        var _this = this;
    })

    .service('CalculatorService', function() {
        var _this = this;

        // Loan
        this.getAllIn = function(p) {
            if(p && p.initial) {
                return p.initial.purchasePrice+p.initial.repairsAndImprovements;
            } else {
                console.log("Unexpected got empty property values in getAllIn()");
                return 0;
            }
        };

        // Income
        this.getGrossAnnualOperatingIncome = function(p) {
            if(p && p.income) {
                var monthlyIncome = (p.income.grossMonthlyRentalIncome || 0) + (p.income.otherMonthlyIncome || 0); // protection against NaN
                var monthlyLoss = (p.income.grossMonthlyRentalIncome || 0) * (p.expenses.vacancyRateLoss || 0)/100;
                return monthlyIncome*12 - (monthlyLoss*12);
            } else {
                console.log("Unexpected got empty property values in getGrossAnnualOperatingIncome()");
                return 0;
            }
        };
        this.getGrossOperatingIncome = function(p) { // monthly
            return _this.getGrossAnnualOperatingIncome(p)/12;
        };
        /*
         this.getNetAnnualOperatingIncome = function(property) {
         return property.totalAnnualOperatingIncome - property.totalAnnualOperatingExpenses;
         };*/

        // Expenses
        this.getAnnualExpenses = function(p) {
            if(p && p.expenses && p.income) {
                var tax = p.expenses.annualPropertyTax || 0;
                var insurance = p.expenses.annualInsurance || 0;
                var expenses = (p.expenses.miscMonthlyExpenses || 0)*12;
                var management = (p.income.grossMonthlyRentalIncome || 0) * (p.expenses.propertyManagementPercent || 0)/100 * 12;
                var maintenance = (p.income.grossMonthlyRentalIncome || 0) * (p.expenses.maintenancePercent || 0)/100 * 12;
                return tax + insurance + expenses + management + maintenance;
            } else {
                console.log("Unexpected got empty property values in getAnnualExpenses()");
                return 0;
            }
        };
        this.getTotalOperatingExpenses = function(p) { // monthly
            return _this.getAnnualExpenses(p)/12;
        };
        this.getTotalCashOutlay = function(p) {
            console.error("Implement getTotalCashOutlay()");
            return 2405.00
        };

        // Financing
        this.getDownPayment = function(p) {
            if(p && p.loan) {
                return _this.getAllIn(p) * p.loan.downPaymentPercent/100
            } else {
                console.log("Unexpected got empty property values in getDownPayment()");
                return 0;
            }
        };
        this.getLoanAmount = function(p) {
            return _this.getAllIn(p) - _this.getDownPayment(p);
        };
        this.getLoanPayment = function(p) { // monthly
            if(p && p.loan) {
                return ExcelFormulas.PMT(p.loan.interestRate/100/12, p.loan.termYears*12, -_this.getLoanAmount(p));
            } else {
                console.log("Unexpected got empty property values in getLoanPayment()");
                return 0;
            }
        };
        this.getPITI = function(p) {
            if(p && p.expenses) {
                return _this.getLoanPayment(p) + (p.expenses.annualInsurance/12) + (p.expenses.annualPropertyTax/12);
            } else {
                console.log("Unexpected got empty property values in getPITI()");
                return 0;
            }
        };

        // Pro forma
        this.getDebtService = function(p) { // monthly
            return -_this.getLoanPayment(p);
        };
        this.getNetOperatingIncome = function(p) { // monthly
            return _this.getGrossOperatingIncome(p) - _this.getTotalOperatingExpenses(p);
        };

        // Investment stats
        this.getCapRate = function(p) {
            return _this.getGrossAnnualOperatingIncome(p) / _this.getAllIn(p);
        };
        this.getCashFlow = function(p) {
            return _this.getNetOperatingIncome(p) + _this.getDebtService(p);
        };
        this.getDSCR = function(p) {
            console.error("Implement getDSCR()");
            return 1.34;
        };
        this.getGRM = function(p) {
            if(p && p.income) {
                return _this.getAllIn(p)/ (p.income.grossMonthlyRentalIncome*12);
            } else {
                console.log("Unexpected got empty property values in getGRM()");
                return 0;
            }
        };
        this.getLTV = function(p) {
            if(p && p.value) {
                return _this.getLoanAmount(p) / p.value.appraisedValue;
            } else {
                console.log("Unexpected got empty property values in getLTV()");
                return 0;
            }
        };
    })

    .service('CriteriaService', function() {
        var _Criteria = function() {
            return {
                capRate: 12,
                cashFlow: 250,
                grm: 7,
                dscr: 1.3,
                ltv: 75
            }
        };

        this.allCriteria = function() {
            // TODO: This is RIDICULOUSLY inefficient --- it's called all the damn time!
            var criteriaString = window.localStorage['criteria'];
            if( criteriaString ) {
                var criteria = angular.fromJson(criteriaString);

                if( typeof criteria !== "object" ) {
                    return new _Criteria();
                }

                return criteria;
            } else {
                return new _Criteria();
            }
        };

        this.save = function( criteria ) {
            assert(typeof criteria === "object", "Got non-object Criteria");

            // TODO: make this more efficient?
            window.localStorage['criteria'] = angular.toJson(criteria);
        };
    })

    .factory('CameraFactory', ['$q', function($q) {
        if( ionic.Platform.isWebView() && ionic.Platform.isReady ) { // running in the Cordova Web view
            return {
                getPicture: function(options) {
                    var q = $q.defer();

                    navigator.camera.getPicture(function(result) {
                        // Do any magic you need
                        q.resolve(result);
                    }, function(err) {
                        q.reject(err);
                    }, options);

                    return q.promise;
                }
            }
        } else {
            return {
                getPicture: function(options) {
                    // TODO: Web implementation?
                    return null;
                }
            }
        }

    }])


;