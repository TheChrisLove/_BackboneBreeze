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
     * Build location breadcrumbs navigation.
     * @memberof KnockoutBindings
     */
    _this.locationBreadcrumbs = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            // This will be called when the binding is first applied to an element
            // Set up any initial state, event handlers, etc. here
            //var nav = bindingContext.$data.title() + '/';
            //var nav = valueAccessor().arguments
            var id = parseInt(viewModel.parentId());
            var locationGroup = bindingContext.$parent.model.get('locations').where({
                ParentId: id
            });
            var $el = $(element);
            var $html = "";
            for (l = 0; l < locationGroup.length; l++) {
                if (locationGroup[l].get('Id') != viewModel.activeId()) {
                    var inactivestyle = "";
                    if (!locationGroup[l].get('IsActive')) inactivestyle = " inactive";

                    var glyphicon_style = "";

                    if (locationGroup[l].get('LocationTypeId') == "2") //org
                        glyphicon_style = "glyphicon glyphicon-map-marker";
                    else if (locationGroup[l].get('LocationTypeId') == "3") //group
                        glyphicon_style = "glyphicon glyphicon-folder-close";
                    else if (locationGroup[l].get('LocationTypeId') == "4") //devicegroup
                        glyphicon_style = "glyphicon glyphicon-hdd";
                    else if (locationGroup[l].get('LocationTypeId') == "5") //maingroup
                        glyphicon_style = "glyphicon glyphicon-folder-close";

                    $html += '<li class="crumb' + inactivestyle + '" data-locationid="' + locationGroup[l].get('Id') + '" data-locationtypeid="' + locationGroup[l].get('LocationTypeId') + '"><p><span  class="' + glyphicon_style + '"></span>&nbsp;<span>' + locationGroup[l].get('Name') + '</span></p></li>';
                }
            }
            $el.append($html);
        }
    };

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
	
var _listBuilder = function(args){
	var html = '';
	html += '<option name="" value=""></option>';
	var option, optionText, optionValue;
	for(var i = 0; i < args.list.length; i++){
		option = args.list[i];
		optionText = (option.cid) ? option.get('Code') : option.Code;
		optionValue = (option.cid) ? option.get('Code') : option.Code;
		optionName = (option.cid) ? option.get('Name') : option.Name;
		html += '<option name="' + optionName + '"';
		html += ' value="' + optionValue + '"';
		if(optionValue == args.selected) html += ' selected';
		html += '>' + optionText + '</option>';
	}
	return html;
};
	
	/*Creating a sample state list to be used in view templates*/
    _this.renderList = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            // This will be called when the binding is first applied to an element
            // Set up any initial state, event handlers, etc. here
			var value = ko.unwrap(valueAccessor());

			viewModel.model.listenTo(Backbone.EventBroker, "dictionaryUpdates:" + value.name, function(dictionary){
			$el = $(element);
            $html = _listBuilder({list: dictionary.get('ValueItems').models, selected: value.selected()});
			$el.children().remove();
			if($html !== ''){$el.append($html)};
			});
			var dictionary = app.dictionaries.getDictionary(value.name);
            var $el = $(element);
            var $html = _listBuilder({list: dictionary.get('ValueItems').models, selected: value.selected()});
			if($html !== ''){$el.append($html)};
			
        }
    };

    /*Creating a simple timeZone list to be used in view templates*/
    _this.timezoneName = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            // This will be called when the binding is first applied to an element
            // Set up any initial state, event handlers, etc. here
            var value = ko.unwrap(valueAccessor());
            var $el = $(element);
            var $html = "";
            $html += '<option value=""></option>';
            $html += '<option name="Eastern Standard Time" value="Eastern Standard Time">Eastern Standard Time</option>';
            $html += '<option name="Central Standard Time" value="Central Standard Time">Central Standard Time</option>';
            $html += '<option name="Mountain Standard Time" value="Mountain Standard Time">Mountain Standard Time</option>';
            $html += '<option name="Pacific Standard Time" value="Pacific Standard Time">Pacific Standard Time</option>';
            $html += '<option name="Alaskan Standard Time" value="Alaskan Standard Time">Alaskan Standard Time</option>';
            $html += '<option name="Hawaiian Standard Time" value="Hawaiian Standard Time">Hawaiian Standard Time</option>';
            $el.append($html);
            $el.find('option[name="' + value + '"]').prop('selected', true);

        }
    };
});