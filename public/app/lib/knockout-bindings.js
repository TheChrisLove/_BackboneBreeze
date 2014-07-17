/* global define, require, l, $el */
/**
 * Custom knockout bindings
 * @external Knockout
 * @see {@link http://www.benhron.com somelink}
 */
define(function($, Backbone, _) {
    var _ = require('underscore'),
        $ = require('jquery'),
        Backbone = require('backbone'),
        ko = require('knockout');

    "use strict";

    /**
     * @class KnockoutBindings
     * @extends external:Knockout
     */
    var KnockoutBindings = function() {
        // empty for now, could build up logic pertinent to setup of custom bindings   
        return ko.bindingHandlers;

    };

    // We want to add custom bindings on load, so initialize the class and update.
    var _this = new KnockoutBindings();

    /**
     * Helper for easily building a bootstrap grid dynamically.
     * Uses valueAccessor().columns and rows to define cols and rows.
     * @memberof KnockoutBindings
     */
    _this.bootstrapGrid = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var value = ko.unwrap(valueAccessor());
            var $el = $(element);
            var cols = value.columns();
            var colClass = 'col-md-' + Math.floor(12 / cols) + ' column';
            var grid = '';
            var sel = '';
            for (var r = 1; r <= value.rows(); r++) {
                grid += '<div class="row clearfix">';
                for (var c = 1; c <= value.columns(); c++) {
                    sel = 'Row' + r + '_Cell' + c;
                    grid += '<div class="' + colClass + ' ' + sel + '"></div>';
                }
                grid += '</div>';
            }
            $el.append($(grid));
        },
    };

    /**
     * Helper for rendering an url-friendly arguments string.
     * Pass in arguments as props : { 'key' : 'value' }, static : { 'key' : 'value' }
     * where props are key/value pairs for url key and value is viewModel property value
     * and static is an object of literal arguments
     * @memberof KnockoutBindings
     */
    _this.urlArgs = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            // This will be called when the binding is first applied to an element
            // Set up any initial state, event handlers, etc. here
            var args;
            $.each(ko.unwrap(valueAccessor()), function(k, v) {
                args = (args) ? args + '&' : '';
                args += encodeURIComponent(k) + '=' + encodeURIComponent((_.isFunction(v)) ? v() : v);
            });
            $el = $(element).data('args', args);
        },
    };

    /**
     * Helper for data-href property for controller submenu actions
     * @memberof KnockoutBindings
     */
    _this.subNav = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            // This will be called when the binding is first applied to an element
            // Set up any initial state, event handlers, etc. here
            //var nav = bindingContext.$data.title() + '/';
            //var nav = valueAccessor().arguments
            var value = ko.unwrap(valueAccessor());
            var nav = value.controller() + '/' + value.action() + '/';
            var $el = $(element);
            $el.data('href', nav);
            $el.attr('data-href', nav);
            if (viewModel.active() === true) $el.addClass('active');
        },
        update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            // This will be called when the binding is first applied to an element
            // Set up any initial state, event handlers, etc. here
            //var nav = bindingContext.$data.title() + '/';
            //var nav = valueAccessor().arguments
            var value = ko.unwrap(valueAccessor());
            var $el = $(element);
            if (viewModel.active() === true) $el.addClass('active');
            else $el.removeClass('active');
        }
    };
	
});