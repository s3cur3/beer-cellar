/*!
 * Copyright 2014 Drifty Co.
 * http://drifty.com/
 *
 * Ionic, v1.0.0-beta.11
 * A powerful HTML5 mobile app framework.
 * http://ionicframework.com/
 *
 * By @maxlynch, @benjsperry, @adamdbradley <3
 *
 * Licensed under the MIT license. Please see LICENSE for more information.
 *
 */

(function() {

// Create namespaces
//
window.ionic = {
  controllers: {},
  views: {},
  version: '1.0.0-beta.11'
};

(function(window, document, ionic) {

  var readyCallbacks = [];
  var isDomReady = false;

  function domReady() {
    isDomReady = true;
    for(var x=0; x<readyCallbacks.length; x++) {
      ionic.requestAnimationFrame(readyCallbacks[x]);
    }
    readyCallbacks = [];
    document.removeEventListener('DOMContentLoaded', domReady);
  }
  document.addEventListener('DOMContentLoaded', domReady);

  // From the man himself, Mr. Paul Irish.
  // The requestAnimationFrame polyfill
  // Put it on window just to preserve its context
  // without having to use .call
  window._rAF = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            function( callback ){
              window.setTimeout(callback, 16);
            };
  })();

  var cancelAnimationFrame = window.cancelAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    window.mozCancelAnimationFrame ||
    window.webkitCancelRequestAnimationFrame;

  /**
  * @ngdoc utility
  * @name ionic.DomUtil
  * @module ionic
  */
  ionic.DomUtil = {
    //Call with proper context
    /**
     * @ngdoc method
     * @name ionic.DomUtil#requestAnimationFrame
     * @alias ionic.requestAnimationFrame
     * @description Calls [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window.requestAnimationFrame), or a polyfill if not available.
     * @param {function} callback The function to call when the next frame
     * happens.
     */
    requestAnimationFrame: function(cb) {
      return window._rAF(cb);
    },

    cancelAnimationFrame: function(requestId) {
      cancelAnimationFrame(requestId);
    },

    /**
     * @ngdoc method
     * @name ionic.DomUtil#animationFrameThrottle
     * @alias ionic.animationFrameThrottle
     * @description
     * When given a callback, if that callback is called 100 times between
     * animation frames, adding Throttle will make it only run the last of
     * the 100 calls.
     *
     * @param {function} callback a function which will be throttled to
     * requestAnimationFrame
     * @returns {function} A function which will then call the passed in callback.
     * The passed in callback will receive the context the returned function is
     * called with.
     */
    animationFrameThrottle: function(cb) {
      var args, isQueued, context;
      return function() {
        args = arguments;
        context = this;
        if (!isQueued) {
          isQueued = true;
          ionic.requestAnimationFrame(function() {
            cb.apply(context, args);
            isQueued = false;
          });
        }
      };
    },

    /**
     * @ngdoc method
     * @name ionic.DomUtil#getPositionInParent
     * @description
     * Find an element's scroll offset within its container.
     * @param {DOMElement} element The element to find the offset of.
     * @returns {object} A position object with the following properties:
     *   - `{number}` `left` The left offset of the element.
     *   - `{number}` `top` The top offset of the element.
     */
    getPositionInParent: function(el) {
      return {
        left: el.offsetLeft,
        top: el.offsetTop
      };
    },

    /**
     * @ngdoc method
     * @name ionic.DomUtil#ready
     * @description
     * Call a function when the DOM is ready, or if it is already ready
     * call the function immediately.
     * @param {function} callback The function to be called.
     */
    ready: function(cb) {
      if(isDomReady || document.readyState === "complete") {
        ionic.requestAnimationFrame(cb);
      } else {
        readyCallbacks.push(cb);
      }
    },

    /**
     * @ngdoc method
     * @name ionic.DomUtil#getTextBounds
     * @description
     * Get a rect representing the bounds of the given textNode.
     * @param {DOMElement} textNode The textNode to find the bounds of.
     * @returns {object} An object representing the bounds of the node. Properties:
     *   - `{number}` `left` The left positton of the textNode.
     *   - `{number}` `right` The right positton of the textNode.
     *   - `{number}` `top` The top positton of the textNode.
     *   - `{number}` `bottom` The bottom position of the textNode.
     *   - `{number}` `width` The width of the textNode.
     *   - `{number}` `height` The height of the textNode.
     */
    getTextBounds: function(textNode) {
      if(document.createRange) {
        var range = document.createRange();
        range.selectNodeContents(textNode);
        if(range.getBoundingClientRect) {
          var rect = range.getBoundingClientRect();
          if(rect) {
            var sx = window.scrollX;
            var sy = window.scrollY;

            return {
              top: rect.top + sy,
              left: rect.left + sx,
              right: rect.left + sx + rect.width,
              bottom: rect.top + sy + rect.height,
              width: rect.width,
              height: rect.height
            };
          }
        }
      }
      return null;
    },

    /**
     * @ngdoc method
     * @name ionic.DomUtil#getChildIndex
     * @description
     * Get the first index of a child node within the given element of the
     * specified type.
     * @param {DOMElement} element The element to find the index of.
     * @param {string} type The nodeName to match children of element against.
     * @returns {number} The index, or -1, of a child with nodeName matching type.
     */
    getChildIndex: function(element, type) {
      if(type) {
        var ch = element.parentNode.children;
        var c;
        for(var i = 0, k = 0, j = ch.length; i < j; i++) {
          c = ch[i];
          if(c.nodeName && c.nodeName.toLowerCase() == type) {
            if(c == element) {
              return k;
            }
            k++;
          }
        }
      }
      return Array.prototype.slice.call(element.parentNode.children).indexOf(element);
    },

    /**
     * @private
     */
    swapNodes: function(src, dest) {
      dest.parentNode.insertBefore(src, dest);
    },

    /**
     * @private
     */
    centerElementByMargin: function(el) {
      el.style.marginLeft = (-el.offsetWidth) / 2 + 'px';
      el.style.marginTop = (-el.offsetHeight) / 2 + 'px';
    },
    //Center twice, after raf, to fix a bug with ios and showing elements
    //that have just been attached to the DOM.
    centerElementByMarginTwice: function(el) {
      ionic.requestAnimationFrame(function() {
        ionic.DomUtil.centerElementByMargin(el);
        setTimeout(function() {
          ionic.DomUtil.centerElementByMargin(el);
          setTimeout(function() {
            ionic.DomUtil.centerElementByMargin(el);
          });
        });
      });
    },

    elementIsDescendant: function(el, parent, stopAt) {
      var current = el;
      do {
        if (current === parent) return true;
        current = current.parentNode;
      } while (current && current !== stopAt);
      return false;
    },

    /**
     * @ngdoc method
     * @name ionic.DomUtil#getParentWithClass
     * @param {DOMElement} element
     * @param {string} className
     * @returns {DOMElement} The closest parent of element matching the
     * className, or null.
     */
    getParentWithClass: function(e, className, depth) {
      depth = depth || 10;
      while(e.parentNode && depth--) {
        if(e.parentNode.classList && e.parentNode.classList.contains(className)) {
          return e.parentNode;
        }
        e = e.parentNode;
      }
      return null;
    },
    /**
     * @ngdoc method
     * @name ionic.DomUtil#getParentOrSelfWithClass
     * @param {DOMElement} element
     * @param {string} className
     * @returns {DOMElement} The closest parent or self matching the
     * className, or null.
     */
    getParentOrSelfWithClass: function(e, className, depth) {
      depth = depth || 10;
      while(e && depth--) {
        if(e.classList && e.classList.contains(className)) {
          return e;
        }
        e = e.parentNode;
      }
      return null;
    },

    /**
     * @ngdoc method
     * @name ionic.DomUtil#rectContains
     * @param {number} x
     * @param {number} y
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @returns {boolean} Whether {x,y} fits within the rectangle defined by
     * {x1,y1,x2,y2}.
     */
    rectContains: function(x, y, x1, y1, x2, y2) {
      if(x < x1 || x > x2) return false;
      if(y < y1 || y > y2) return false;
      return true;
    }
  };

  //Shortcuts
  ionic.requestAnimationFrame = ionic.DomUtil.requestAnimationFrame;
  ionic.cancelAnimationFrame = ionic.DomUtil.cancelAnimationFrame;
  ionic.animationFrameThrottle = ionic.DomUtil.animationFrameThrottle;
})(window, document, ionic);

/**
 * ion-events.js
 *
 * Author: Max Lynch <max@drifty.com>
 *
 * Framework events handles various mobile browser events, and
 * detects special events like tap/swipe/etc. and emits them
 * as custom events that can be used in an app.
 *
 * Portions lovingly adapted from github.com/maker/ratchet and github.com/alexgibson/tap.js - thanks guys!
 */

(function(ionic) {

  // Custom event polyfill
  ionic.CustomEvent = (function() {
    if( typeof window.CustomEvent === 'function' ) return CustomEvent;

    var customEvent = function(event, params) {
      var evt;
      params = params || {
        bubbles: false,
        cancelable: false,
        detail: undefined
      };
      try {
        evt = document.createEvent("CustomEvent");
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
      } catch (error) {
        // fallback for browsers that don't support createEvent('CustomEvent')
        evt = document.createEvent("Event");
        for (var param in params) {
          evt[param] = params[param];
        }
        evt.initEvent(event, params.bubbles, params.cancelable);
      }
      return evt;
    };
    customEvent.prototype = window.Event.prototype;
    return customEvent;
  })();


  /**
   * @ngdoc utility
   * @name ionic.EventController
   * @module ionic
   */
  ionic.EventController = {
    VIRTUALIZED_EVENTS: ['tap', 'swipe', 'swiperight', 'swipeleft', 'drag', 'hold', 'release'],

    /**
     * @ngdoc method
     * @name ionic.EventController#trigger
     * @alias ionic.trigger
     * @param {string} eventType The event to trigger.
     * @param {object} data The data for the event. Hint: pass in
     * `{target: targetElement}`
     * @param {boolean=} bubbles Whether the event should bubble up the DOM.
     * @param {boolean=} cancelable Whether the event should be cancelable.
     */
    // Trigger a new event
    trigger: function(eventType, data, bubbles, cancelable) {
      var event = new ionic.CustomEvent(eventType, {
        detail: data,
        bubbles: !!bubbles,
        cancelable: !!cancelable
      });

      // Make sure to trigger the event on the given target, or dispatch it from
      // the window if we don't have an event target
      data && data.target && data.target.dispatchEvent && data.target.dispatchEvent(event) || window.dispatchEvent(event);
    },

    /**
     * @ngdoc method
     * @name ionic.EventController#on
     * @alias ionic.on
     * @description Listen to an event on an element.
     * @param {string} type The event to listen for.
     * @param {function} callback The listener to be called.
     * @param {DOMElement} element The element to listen for the event on.
     */
    on: function(type, callback, element) {
      var e = element || window;

      // Bind a gesture if it's a virtual event
      for(var i = 0, j = this.VIRTUALIZED_EVENTS.length; i < j; i++) {
        if(type == this.VIRTUALIZED_EVENTS[i]) {
          var gesture = new ionic.Gesture(element);
          gesture.on(type, callback);
          return gesture;
        }
      }

      // Otherwise bind a normal event
      e.addEventListener(type, callback);
    },

    /**
     * @ngdoc method
     * @name ionic.EventController#off
     * @alias ionic.off
     * @description Remove an event listener.
     * @param {string} type
     * @param {function} callback
     * @param {DOMElement} element
     */
    off: function(type, callback, element) {
      element.removeEventListener(type, callback);
    },

    /**
     * @ngdoc method
     * @name ionic.EventController#onGesture
     * @alias ionic.onGesture
     * @description Add an event listener for a gesture on an element.
     *
     * Available eventTypes (from [hammer.js](http://eightmedia.github.io/hammer.js/)):
     *
     * `hold`, `tap`, `doubletap`, `drag`, `dragstart`, `dragend`, `dragup`, `dragdown`, <br/>
     * `dragleft`, `dragright`, `swipe`, `swipeup`, `swipedown`, `swipeleft`, `swiperight`, <br/>
     * `transform`, `transformstart`, `transformend`, `rotate`, `pinch`, `pinchin`, `pinchout`, </br>
     * `touch`, `release`
     *
     * @param {string} eventType The gesture event to listen for.
     * @param {function(e)} callback The function to call when the gesture
     * happens.
     * @param {DOMElement} element The angular element to listen for the event on.
     */
    onGesture: function(type, callback, element) {
      var gesture = new ionic.Gesture(element);
      gesture.on(type, callback);
      return gesture;
    },

    /**
     * @ngdoc method
     * @name ionic.EventController#offGesture
     * @alias ionic.offGesture
     * @description Remove an event listener for a gesture on an element.
     * @param {string} eventType The gesture event.
     * @param {function(e)} callback The listener that was added earlier.
     * @param {DOMElement} element The element the listener was added on.
     */
    offGesture: function(gesture, type, callback) {
      gesture.off(type, callback);
    },

    handlePopState: function(event) {}
  };


  // Map some convenient top-level functions for event handling
  ionic.on = function() { ionic.EventController.on.apply(ionic.EventController, arguments); };
  ionic.off = function() { ionic.EventController.off.apply(ionic.EventController, arguments); };
  ionic.trigger = ionic.EventController.trigger;//function() { ionic.EventController.trigger.apply(ionic.EventController.trigger, arguments); };
  ionic.onGesture = function() { return ionic.EventController.onGesture.apply(ionic.EventController.onGesture, arguments); };
  ionic.offGesture = function() { return ionic.EventController.offGesture.apply(ionic.EventController.offGesture, arguments); };

})(window.ionic);

/**
  * Simple gesture controllers with some common gestures that emit
  * gesture events.
  *
  * Ported from github.com/EightMedia/hammer.js Gestures - thanks!
  */
(function(ionic) {

  /**
   * ionic.Gestures
   * use this to create instances
   * @param   {HTMLElement}   element
   * @param   {Object}        options
   * @returns {ionic.Gestures.Instance}
   * @constructor
   */
  ionic.Gesture = function(element, options) {
    return new ionic.Gestures.Instance(element, options || {});
  };

  ionic.Gestures = {};

  // default settings
  ionic.Gestures.defaults = {
    // add css to the element to prevent the browser from doing
    // its native behavior. this doesnt prevent the scrolling,
    // but cancels the contextmenu, tap highlighting etc
    // set to false to disable this
    stop_browser_behavior: 'disable-user-behavior'
  };

  // detect touchevents
  ionic.Gestures.HAS_POINTEREVENTS = window.navigator.pointerEnabled || window.navigator.msPointerEnabled;
  ionic.Gestures.HAS_TOUCHEVENTS = ('ontouchstart' in window);

  // dont use mouseevents on mobile devices
  ionic.Gestures.MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android|silk/i;
  ionic.Gestures.NO_MOUSEEVENTS = ionic.Gestures.HAS_TOUCHEVENTS && window.navigator.userAgent.match(ionic.Gestures.MOBILE_REGEX);

  // eventtypes per touchevent (start, move, end)
  // are 