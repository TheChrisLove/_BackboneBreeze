/* global window, Modernizr */ 
(function (global) {

    // EventSource is used for the subscribe pattern
    Modernizr.load([
        {
            test: window.EventSource,
            nope: ['vendor/shims/EventSource.shim.js']
        }
    ]);
    
})(this);