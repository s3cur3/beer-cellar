'use strict';

describe('Real estate app', function() {
    beforeEach(function() {
        //browser().navigateTo('../../app/notes.html');
        browser().navigateTo('/#/app/property');
    });

    var oldCount=-1;
    it("updates property info dynamically", function () {
        element(by.model('property.purchasePrice')).sendKeys('63001');
        var allInPrice = element(by.id('allInPrice'));
        expect(allInPrice.getText()).toEqual('$63,501.00');



        /*element('ul').query(function($el, done) {
            oldCount=$el.children().length;
            done();
        });


        input('note').enter('test data');


        element('button').query(function($el, done) {
            $el.click();
            done();
        });
        */



    });
    it('should add one more element now',function(){
        expect(repeater('ul li').count()).toBe(oldCount+1);
    });

});
