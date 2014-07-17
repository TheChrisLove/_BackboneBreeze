/* global define, $, app */
define([
    'underscore',
    'base/view',
    'text!modules/grid/templates/grid_wrapper.html'
], function(_, View, template) {
    "use strict";

    var Wrapper = View.extend({
        template: _.template(template),

        className: "centered full",

        events: {
            'click .searchGo': 'search',
            'click .inSort': "sortEngine",
            'mouseenter th': 'filter',
            'mouseleave th': 'filter',
            "submit form": "search"
        },

        sortEngine: function(event, clear) {
            var $el = $(event.currentTarget);
            if ($(event.target).parents('.hover_wrapper').length > 0) return false;
            var data = $el.data();
            var columns = $el.siblings();
            columns.add($el).removeClass('sortDirectiondesc').removeClass('sortDirectionasc');
            var sortDir, type, prop;
            if (!clear) {
                var previousSort = this.grid.get('sortBy');
                prop = data.prop;
                type = data.type;

                // calculating the direction of our sort. 
                // only if the previous sort was the same column AND the previous sort direction was descending, then we sort ascending
                // otherwise we sort descending
                sortDir = previousSort.prop == prop && previousSort.dir == 'desc' ? 'asc' : 'desc';

                // Clear siblings of sort flags, add appropriate sort flag
                $el.addClass('sortDirection' + sortDir);
            }

            if (clear === true) {
                var sort = this.grid.get('defaultSort');
                this.grid.set('sortBy', sort);
            } else {
                //this.model.setSortBy(colName, sortDir, sortType);
                this.grid.set('sortBy', {
                    'dir': sortDir,
                    'type': type,
                    'prop': prop
                });
            }
        },

        search: function(event) {
            event.preventDefault();
            event.stopPropagation();
            var $el = (event.currentTarget.nodeName === 'FORM') ?
                $(event.currentTarget).find('input[type="text"]') : $(event.currentTarget).siblings('input[type="text"]');
            var prop = $el.data('prop');
            var val = $el.val();
            if (val == '') this.grid.removeFilter(prop);
            else {
                var predicate;
                if (val.match(/,/)) {
                    var strings = val.split(',');
                    var predicates = [];
                    for (var i = 0, ii = strings.length; i < ii; i++) {
                        predicates.push(app.api.Predicate(prop, 'Contains', strings[i].replace(/^\s\s*/, '').replace(/\s\s*$/, '')));
                    }
                    predicate = app.api.Predicate.or(predicates);
                } else predicate = app.api.Predicate(prop, 'Contains', $el.val());
                this.grid.filter(prop, predicate);
            }
        },

        filter: function(event) {
            // TODO check for mouseleave if input has focus and cancel hide
            // Add blur event to input to hide
            var $el = $(event.currentTarget);
            switch (event.type) {
                case 'mouseenter':
                    $el.find('.hover_wrapper').fadeIn();
                    break;
                case 'mouseleave':
                    // TODO check if input has focus and do not hide if it does
                    // also need to hide input if not moused over and blurred
                    $el.find('.hover_wrapper').hide();
                    break;
            }
        },

        createViewModel: function() {
            if (this.grid) return this.grid.getViewModel();
            else return {};
        }

    });

    return Wrapper;
});