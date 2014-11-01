'use strict';

describe('Controller: AppCtrl', function () {
    var AppCtrl,
        scope;

    // load the controller's module
    beforeEach(module('RealEstateApp'));

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope) {
    //beforeEach(inject(function ($rootScope, $controller) {
        scope = $rootScope.$new();
        AppCtrl = $controller('AppCtrl', {
            $scope: scope
        });
    }));

    it('should have property data', function () {
        expect(scope.property).toBeDefined();
        expect(Object.keys(scope.property).length).toBeGreaterThan(1);
    });

    it('should have criteria', function () {
        expect(scope.criteria).toBeDefined();
        expect(Object.keys(scope.criteria).length).toBeGreaterThan(1);
    });
});

describe('PropertyService tests', function (){
    var PropertyService;

    beforeEach(function (){
        module('RealEstateApp');

        // inject your service for testing.
        // The _underscores_ are a convenience thing
        // so you can have your variable name be the
        // same as your injected service.
        inject(function(_PropertyService_) {
            PropertyService = _PropertyService_;
        });
    });

    // check to see if it has the expected function
    it('should have a newProperty function that returns an object', function () {
        expect( angular.isFunction(PropertyService.newProperty) ).toBe(true);
        expect( typeof PropertyService.newProperty() ).toBe("object");
    });

    it('should have an allProperties function that returns a list of objects', function () {
        expect( angular.isFunction(PropertyService.allProperties) ).toBe(true);
        var propertyList = PropertyService.allProperties();
        expect( Array.isArray(propertyList) ).toBe(true);

        if( propertyList.length > 0 ) {
            expect( typeof propertyList[0]).toBe("object");
        }
    });

    it('should save new properties', function () {
        var prop = PropertyService.newProperty();
        prop.name = "This is a new property";

        PropertyService.save(prop);
        var all = PropertyService.allProperties();


        var found = false;
        for( var i = 0; i < all.length; i++ ) {
            if( all[i].name == "This is a new property" ) {
                found = true;
            }
        }

        expect( found ).toBe(true);
    });

    it('should delete properties', function () {
        var prop = PropertyService.newProperty();
        PropertyService.save(prop);

        PropertyService.delete(prop);

        var all = PropertyService.allProperties();

        var found = false;
        for( var i = 0; i < all.length; i++ ) {
            if( all[i].name == "This is a new property" ) {
                found = true;
            }
        }

        expect( found ).toBe(false);
    });


    it('should order properties when saving', function () {
        var deleteMe = [];
        for( var i = 0; i < 10; i++ ) {
            var prop = PropertyService.newProperty();

            if( i % 3 == 0 ) {
                deleteMe.push(prop);
            }
        }

        var original = PropertyService.allProperties();
        // Shhhh!
        PropertyService.save(_.shuffle(original));

        expect( _.isEqual(original, PropertyService.allProperties()) ).toBe(true);
    });
});