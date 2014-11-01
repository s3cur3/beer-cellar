
function backBtnIsVisible() {
    var btnFound = $(".back-button").length > 0;
    return $(".back-button").is(":visible") || (btnFound && $(".back-button.ng-hide").length == 0);
}

var hideShowTimeouts = [];
function hideOrShowBackBtn() {
    function hideOrShowBackBtnNonRecursive() {
        var menuBtn = $('.buttons.left-buttons');
        if( backBtnIsVisible() ) {
            console.log("back btn found");
            menuBtn.hide();
        } else {
            console.log("no back btn found");
            menuBtn.show();
        }
    }

    for( var i = 0; i < hideShowTimeouts.length; i++) clearTimeout(hideShowTimeouts[i]);
    hideShowTimeouts = [];

    hideOrShowBackBtnNonRecursive();
    var millisecondsToRunAt = [50, 100, 200, 400, 600, 800, 1000, 1200, 1800, 3200, 4000];
    for( var j = 0; j < millisecondsToRunAt.length; j++)
        hideShowTimeouts.push(window.setTimeout(hideOrShowBackBtnNonRecursive, millisecondsToRunAt[j]));
}

angular.module('BeerCellarApp.controllers', [])

    .controller('AppCtrl', ['$scope', '$location', '$ionicModal', 'PropertyService', 'CalculatorService', 'CriteriaService', 'CameraFactory', function( $scope, $location, $ionicModal, PropertyService, CalculatorService, CriteriaService, CameraFactory ) {
        // Set up property functionality
        $scope.propertyService = PropertyService;
        $scope.properties = PropertyService.allProperties();
        $scope.property = $scope.properties[ PropertyService.getLastActiveIndex() ];

        $scope.calc = CalculatorService;

        $scope.criteria = CriteriaService.allCriteria();

        $scope.makePropertiesListComplex = true;

        $scope.selectProperty = function(prop, index) {
            $scope.property = prop;
            PropertyService.setLastActiveIndex(index || prop);
        };

        $scope.analysis = {
            capRateGood: function(p) {
                if(!p) p = $scope.property;
                return $scope.calc.getCapRate(p) * 100 >= $scope.criteria.capRate;
            },
            cashFlowGood: function(p) {
                if(!p) p = $scope.property;
                return $scope.calc.getCashFlow(p) >= $scope.criteria.cashFlow;
            },
            dscrGood: function(p) {
                if(!p) p = $scope.property;
                return $scope.calc.getDSCR(p) > $scope.criteria.dscr;
            },
            grmGood: function(p) {
                if(!p) p = $scope.property;
                return $scope.calc.getGRM(p) < $scope.criteria.grm;
            },
            ltvGood: function(p) {
                if(!p) p = $scope.property;
                return $scope.calc.getLTV(p) * 100 < $scope.criteria.ltv;
            }
        };

        $scope.greenLight = function(p) {
            if(!p) p = $scope.property;

            var giveGreenLight = true;
            for( var fn in $scope.analysis ) {
                if( $scope.analysis.hasOwnProperty(fn) ) {
                    giveGreenLight &= $scope.analysis[fn](p);
                }
            }
            return giveGreenLight;
        };


        // Functionality for the Delete Modal
        $ionicModal.fromTemplateUrl('delete.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal){
            $scope.deleteModal = modal;
        });

        // Tools for deleting a property
        $scope.delete = function(p) {
            $scope.propertyToDelete = p;
            $scope.deleteModal.show();
        };
        $scope._delete = function() {
            $scope.deleteModal.hide();
            PropertyService.delete($scope.propertyToDelete);
            $location.path('/properties');
        };
        $scope.closeDelete = function() {
            $scope.deleteModal.hide();
        };

        // Flags for dealing with editable text fields
        $scope.makeEditable = function(labelForField) {
            $scope.editable = labelForField;
        };
        $scope.isEditable = function(labelForField) {
            return $scope.editable === labelForField;
        };
        $scope.clearEditable = function(label) {
            if($scope.editable == label) // Don't touch it if this field isn't being edited currently!
                $scope.editable = null;
        };

        // Update the master property list whenever we modify this property
        $scope.$watch('property', function(updatedProperty, oldProperty) {
            if( typeof updatedProperty == "object" && updatedProperty ) {
                PropertyService.save(updatedProperty);
                $scope.properties = PropertyService.allProperties();
            } else {
                console.log("Got empty property in an update...?");
            }
        }, true);

        // Update the master criteria list whenever we modify this property
        $scope.$watch('criteria', function(updatedCriteria, oldCriteria) {
            if( typeof updatedCriteria == "object" && updatedCriteria ) {
                console.log("Saving criteria:", updatedCriteria);
                CriteriaService.save(updatedCriteria);
                $scope.criteria = CriteriaService.allCriteria();
            } else {
                console.error("Got empty criteria list in an update...?");
            }
        }, true);
    }])


    .controller('CriteriaCtrl', ['$scope', 'CriteriaService', function($scope, CriteriaService) {
        console.log("In CriteriaCtrl");
        hideOrShowBackBtn();
    }])

    .controller('PropertiesCtrl', ['$scope', '$location', 'PropertyService', function($scope, $location, PropertyService) {
        console.log("In PropertiesCtrl");
        hideOrShowBackBtn();

        $scope.properties = PropertyService.allProperties();
        if( $scope.properties.length == 0 ) {
            $scope.property = PropertyService.newProperty();
            $scope.properties = PropertyService.allProperties();
        }

        $scope.addProperty = function() {
            console.log("Adding property");
            var p = PropertyService.newProperty();
            $scope.properties = PropertyService.allProperties();
            $scope.selectProperty(p);

            console.log("Setting path to " + '/properties/' + PropertyService.getLastActiveIndex());
            $location.path('/#/properties/' + PropertyService.getLastActiveIndex());
        }
    }])

    .controller('PropertyCtrl', ['$scope', '$location', 'PropertyService', function($scope, $location, PropertyService) {
        console.log("In PropertyCtrl");
        hideOrShowBackBtn();

        // Update the currently-in-use property when we load this one
        var re = /[0-9]+$/;
        var id = $location.url().match(re);
        $scope.selectProperty( PropertyService.getPropertyByID(id) );
    }])

    .controller('AnalysisCtrl', function($scope) {
        console.log("In AnalysisCtrl");
        hideOrShowBackBtn();
    })

    .controller('FinancingCtrl', function($scope) {
        console.log("In FinancingCtrl");
        hideOrShowBackBtn();
    })

    .controller('ProFormaCtrl', function($scope) {
        console.log("In ProFormaCtrl");
        hideOrShowBackBtn();

        $scope.renderPDF = function() {
            var doc = new jsPDF();

            // We'll make our own renderer to skip this editor
            var specialElementHandlers = {
                '.button': function(element, renderer){
                    return true;
                }
            };

            // All units are in the set measurement for the document
            // This can be changed to "pt" (points), "mm" (Default), "cm", "in"
            doc.fromHTML(
                document.getElementById('pro-forma')[0], // ID to turn into a PDF
                15, // x coord
                15, // y coord
                {
                    'width': 170,
                    'elementHandlers': specialElementHandlers
                }
            );

            doc.save('Pro Forma.pdf');
        }
    })

    .controller('PhotoCtrl', ['$scope', 'CameraFactory', function($scope, CameraFactory) {
        $scope.getPhoto = function() {
            CameraFactory.getPicture().then(function(imageURI) {
                console.log(imageURI);

                if( !Array.isArray($scope.property.images) ) $scope.property.images = [];

                $scope.property.images.push(imageURI);

            }, function(err) {
                console.err(err);
            });
        };
    }])



;

