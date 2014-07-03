/* global define, app, $ */
define([
    'underscore',
    'backbone',
    'base/view',
    'knockback',
    'knockout',
    'text!modules/grid/templates/baconation.html',
    'modules/grid/hideShowColumns'
], function(_, Backbone, View, kb, ko, template, HideShowColumns) {
    "use strict";

    var PaginationView = View.extend({

        template: _.template(template),

        tagName: 'tr',

        events: {
            "click .page": "capture",
            "click .js-hideShowColumns": "hideShowColumns"
        },

        hideShowColumns: function() {
            var view = new HideShowColumns({
                model: this.model
            });
            app.modal.show({
                title: 'Hide/Show Columns',
                view: view,
                buttons: [{
                    name: 'Apply Changes',
                    fn: view.applyColumns
                }]
            });
        },

        capture: function(event) {
            var go = $(event.currentTarget).text();
            if ((go == 'prev') || (go == 'next')) {
                this.model.movePage((go == 'next') ? 1 : -1);
            } else {
                this.model.setPage(go - 1); // Obscura pages are 0 index based
            }
        },

        createViewModel: function() {
            var viewModel = kb.viewModel(this.model, {
                keys: ['pageSize', '_page', '_filteredCount', '_inlineCount', 'hideShowColumns', '_filters']
            });

            viewModel.pageSizeOptions = ko.observableArray([{
                display: 'Show 5 items.',
                value: 5
            }, {
                display: 'Show 10 items.',
                value: 10
            }, {
                display: 'Show 20 items.',
                value: 20
            }]);

            // Important to compute size here since we may not have all the collection locally
            viewModel.size = ko.computed(function() {
                var size = this._filteredCount();
                var count = this._inlineCount();
                // Use inline count unless a filter has been applied
                return (_.isEmpty(this._filters())) ? count : size;
            }, viewModel);

            // Because Obscura's getNumPages is not reliable for our use (where collection is partial)
            // We calculate our own size (which considers inlineCount as applicable)
            viewModel.total = ko.computed(function() {
                var size = this.size();
                var pageSize = this.pageSize();
                if (pageSize) {
                    if (size === 0) return 1;
                    else return Math.ceil(this.size() / this.pageSize());
                } else return 1;
            }, viewModel);

            // Criteria for if an individual page button should be displayed
            viewModel.showPage = _.bind(function(page) {
                var total = this.total();
                var current = this.page();
                if (page == 1) return false;
                if (total < 5) return true;
                else if (page >= current - 1 &&
                    page <= current + 1 &&
                    page != total) return true;
            }, viewModel);

            // Internal _page is zero index based
            viewModel.page = ko.computed(function() {
                return this._page() + 1;
            }, viewModel);

            return viewModel;
        }

    });

    return PaginationView;
});