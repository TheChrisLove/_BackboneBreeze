/* global define, $, app */
define([
    'underscore',
    'knockout',
    'knockback',
    'base/view'
], function(_, ko, kb, View, template) {
    "use strict";

    var Row = View.extend({

        template: 'app/modules/grid/templates/grid_row.html',

        tagName: "tr",


        // mousedown > blur > click is standard for event firing sequence
        events: {
            'click .js-editable': 'editMode',
            'blur input': 'cancelChanges',
            'mousedown .js-saveEdit': '_save',
            'mouseup .js-saveEdit': 'save'
        },

        /*
        renderTemplate: function(template, context) {
            var templateKey = (_.isFunction(this.template)) ? this.template() : templateKey;
            return kb.renderTemplate(template, this.viewModel, {
                templateKey: this.template
            }, this.el);
        },
        */

        //afterRender: function() {},

        start: function() {
            _.bindAll(this, 'editMode', 'save', 'saveChanges', 'cancelChanges', '_closeEdit', '_save');
            if (this.grid.get('_columns').length == 0) this.grid._loadEntityData();
        },

        cancelChanges: function(event) {
            if (this._editing) {
                this._closeEdit(event);
                if (app.api.manager.hasChanges() === false) {
                    // If the user clicks out to another tab, or to dev tools for ex, this event can fire before knockout's change propagation
                    // In that event, we want to roll back the changes manually
                    var $el = $(event.currentTarget);
                    var $input = $el.find('input');
                    var propValue = this.model.get($input.prop('name'));
                    if ($input.val() != propValue) $input.val(propValue);
                } else app.api.manager.rejectChanges();
            }
        },

        editMode: function(event) {
            if (!this._editing) {
                event.stopPropagation();
                var $el = $(event.currentTarget);
                var $td = $el.parents('td:eq(0)');
                $td.css({
                    width: $td.outerWidth()
                }).addClass('.temp_gridRow_css');
                $el.parents('.editableDataWrapper').hide()
                $el.parents('.js-inlineEdit').find('.js-editableInput').removeClass('hidden').show().find('input').focus();
                this._editing = true;
            }
        },

        _closeEdit: function(event) {
            var $el = $(event.currentTarget).parents('.js-inlineEdit:eq(0)');
            $el.find('input').removeClass('error');
            $el.find('.editableInput').hide();
            $el.find('.editableDataWrapper').show();
            $el.parents('td:eq(0)').css('width', '');
            this._editing = false;
        },

        _save: function(event, noSave) {
            console.log('_save');
            this._editing = false;
        },

        save: function(event, noSave) {
            this._closeEdit(event);
            this.saveChanges(event);
        },

        saveChanges: function(event) {
            this._saveChanges(event);
        },

        _saveChanges: function(event) {
            if (app.api.manager.hasChanges()) {
                app.api.manager.saveChanges([this.model]).fail(function() {
                    app.api.rejectChanges();
                });
            }

        },

        createViewModel: function(options) {
            var columns = this.grid.get('_columns');
            var columnModels = columns.models;
            var editable = [];
            var displayOnly = [];
            for (var i = 0, ii = columnModels.length; i < ii; i++) {
                var prop = columnModels[i].get('prop');
                if (columnModels[i].get('editable')) editable.push(prop);
                else displayOnly.push(prop);
            }

            var viewModel = this._createViewModel({
                keys: editable
            });

            for (var d = 0, dd = displayOnly.length; d < dd; d++) {
                viewModel[displayOnly[d]] = this.model.get(displayOnly[d]);
            };

            viewModel.columns = kb.collectionObservable(columns);

            return viewModel;
        }
    });

    return Row;
});