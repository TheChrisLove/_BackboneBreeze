/* global define */
define([
    'knockout',
    'underscore',
    'base/view',
    'text!modules/grid/templates/grid_header.html'
], function(ko, _, View, template) {
    "use strict";

    var Header = View.extend({
        template: _.template(template),

        createViewModel: function() {
            var viewModel = (this.grid) ? this.grid.getViewModel() : {};

            /**
             *   { action : (function reference),
             *     glyphicon : 'string class',
             *     display: 'string to display',
             *     loading: 'string loading text' }
             */
            //viewModel.hotkeys = ko.observableArray([]);

            //viewModel.dropdownButton = 'String to Display';
            /**
             *    { action: (function reference),
             *      display: 'String to display' }
             */
            //viewModel.dropdownOptions = ko.observableArray([]);

            return viewModel;
        }

    });

    return Header;
});