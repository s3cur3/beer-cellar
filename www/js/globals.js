
var KINVEY_DEBUG = false;
var appVersion = version.basic;

// a temporary random string; gets reset once we know the username
// we use this in the ID when creating objects in the database
var uuid = Math.random().toString(36).substring(7);
var deletedIDs = [];

var PURCHASE_ID_ONE_MONTH = "com.cisoftware.beercellar.onemonth";
var PURCHASE_ID_ONE_YEAR = "com.cisoftware.beercellar.oneyear";
var PURCHASE_ID_LIFETIME = "com.cisoftware.beercellar.lifetime";

var g_billing_initialized = false;
var g_local_account_only = true;



function androidCheckSubscriptions() {
    return inappbilling.getPurchases(
        function success(ownedProductsArray) {
            for(var i = 0; i < ownedProductsArray.length; i++) {
                var product = ownedProductsArray[i];
                if(product.productId == PURCHASE_ID_ONE_MONTH ||
                        product.productId == PURCHASE_ID_ONE_YEAR ||
                        product.productId == PURCHASE_ID_LIFETIME) {
                    console.log("EXCELLENT! User has subscription:", product.productId);
                    g_local_account_only = false;
                }
            }
        },
        function failure() {
            console.error("Error retrieving purchases...");
        }
    );
}

/**
 * @return Promise
 */
function checkSubscriptions(hasSubscriptionObj) {
    if(ionic.Platform.isAndroid()) {
        return androidCheckSubscriptions(hasSubscriptionObj);
    }
    if(ionic.Platform.isIOS()) {
        // TODO: iOS Billing
    }
}



function exit(statusToAlert) {
    // http://kevin.vanzonneveld.net
    // +   original by: Brett Zamir (http://brettz9.blogspot.com)
    // +      input by: Paul
    // +   bugfixed by: Hyam Singer (http://www.impact-computing.com/)
    // +   improved by: Philip Peterson
    // +   bugfixed by: Brett Zamir (http://brettz9.blogspot.com)
    // %        note 1: Should be considered expirimental. Please comment on this function.
    // *     example 1: exit();
    // *     returns 1: null

    var i;

    if (typeof statusToAlert === 'string') {
        alert(statusToAlert);
    }

    window.addEventListener('error', function (e) {e.preventDefault();e.stopPropagation();}, false);

    var handlers = [
        'copy', 'cut', 'paste',
        'beforeunload', 'blur', 'change', 'click', 'contextmenu', 'dblclick', 'focus', 'keydown', 'keypress', 'keyup', 'mousedown', 'mousemove', 'mouseout', 'mouseover', 'mouseup', 'resize', 'scroll',
        'DOMNodeInserted', 'DOMNodeRemoved', 'DOMNodeRemovedFromDocument', 'DOMNodeInsertedIntoDocument', 'DOMAttrModified', 'DOMCharacterDataModified', 'DOMElementNameChanged', 'DOMAttributeNameChanged', 'DOMActivate', 'DOMFocusIn', 'DOMFocusOut', 'online', 'offline', 'textInput',
        'abort', 'close', 'dragdrop', 'load', 'paint', 'reset', 'select', 'submit', 'unload'
    ];

    function stopPropagation (e) {
        e.stopPropagation();
        // e.preventDefault(); // Stop for the form controls, etc., too?
    }
    for (i=0; i < handlers.length; i++) {
        window.addEventListener(handlers[i], function (e) {stopPropagation(e);}, true);
    }

    if (window.stop) {
        window.stop();
    }

    throw '';
}


function assert( testResult, optionalErrorMsg ) {
    if(!testResult) {
        var errorStr = "ERROR";
        if( optionalErrorMsg ) {
            errorStr += ": " + optionalErrorMsg;
        }

        console.error( errorStr );
        exit();
    }
}



function runningOnDevice() {
    return /ios|iphone|ipod|ipad|android/i.test(navigator.userAgent);
}
