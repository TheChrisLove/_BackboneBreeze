/* global define, require, l, $el */

/* global require, app, window, Backbone, DEBUG */
// Requiring 'modernizer' fires off modernizer's shim loader
require(["knockout"], function() {
    require(["knockout", "knockback"],
        function(ko, kb) {
            "use strict";

            window.ko = ko;
            window.kb = kb;


            kb.renderTemplate = function(template, view_model, options, el) {
                var el, observable;

                if (options == null) {
                    options = {};
                }
                if (!el) el = document.createElement('div');
                observable = ko.renderTemplate(template, view_model, options, el, 'replaceChildren');
                if (el.children.length === 1) {
                    el = el.children[0];
                }
                kb.releaseOnNodeRemove(view_model, el);
                observable.dispose();
                if (view_model.afterRender && !options.afterRender) {
                    view_model.afterRender(el);
                }
                return el;
            };


        });
});