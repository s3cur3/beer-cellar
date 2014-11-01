describe('Main controller (AppCtrl)', function() {

    beforeEach(inject(function ($injector) {
        $scope = $injector.get('$rootScope');
        $controller = $injector.get('$controller');
    }));

    it('should have property data', function() {
        var params = {
            $scope: $scope
        };
        var ctrl = $controller('AppCtrl', params);

        expect(Object.keys($scope.property).length).toBeGreaterThan(0);
    });
});