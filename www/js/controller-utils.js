
function backBtnIsVisible() {
    var btnFound = $(".back-button").length > 0;
    return $(".back-button").is(":visible") || (btnFound && $(".back-button.hide").length == 0);
}

var hideShowTimeouts = [];
function hideOrShowBackBtn() {
    var DEBUG_BACK_BTN = false;

    function hideOrShowBackBtnNonRecursive() {
        var menuBtn = $('ion-header-bar .left-buttons');
        if( backBtnIsVisible() ) {
            if(DEBUG_BACK_BTN) console.log("back btn found");
            menuBtn.hide();
        } else {
            if(DEBUG_BACK_BTN) console.log("no back btn found");
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

if(!runningOnDevice()) {
    // Need to stub out Cordova plugins
    angular.module('ngCordova', []).factory('$cordovaFile', function() { return {}; });
}



