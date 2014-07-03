/* global define, app */
define([
    'underscore',
    'backbone',
    'base/view',
    'knockback',
    'knockout',
    'text!modules/grid/templates/hideShowColumns.html'
], function(_, Backbone, View, kb, ko, template) {
    "use strict";

    var BasicView = View.extend({

        template: _.template(template),

        start: function() {
            _.bindAll(this, 'applyColumns');
        },

        applyColumns: function() {
            var checked = this.$el.find('input:checked');
            var setCols = [];
            for (var i = 0; i < checked.length; i++) {
                setCols.push($(checked[i]).data('prop'));
            }

            this.model.resetColumns(setCols);
            app.modal.close();
        },

        createViewModel: function() {
            var viewModel = {
                properties: kb.collectionObservable(this.model.get('viewModelProperties')),
            };

            viewModel.isActive = function(name) {
                return this.model.get('_columns').findWhere({
                    prop: name
                });
            };

            return viewModel;
        }

    });

    return BasicView;
});