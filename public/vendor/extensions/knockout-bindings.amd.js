/*!
 *  In house, custom Knockout Bindings
 */
define(function ($, Backbone, _) {
    var _ = require('underscore')
      , $ = require('jquery')
      , Backbone = require('backbone')
      , ko = require('knockout') 

    "use strict";

    (function () {
        
        
         // Locations Breadcrumbs 
         ko.bindingHandlers.locationBreadcrumbs = {
            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                // This will be called when the binding is first applied to an element
                // Set up any initial state, event handlers, etc. here
                //var nav = bindingContext.$data.title() + '/';
                //var nav = valueAccessor().arguments
                var id = parseInt(viewModel.parentId());
                var locationGroup = bindingContext.$parent.model.get('locations').where({ParentId: id}); 
                var $el = $(element);
                var $html = "";
                for(l = 0; l < locationGroup.length; l++){
                    if(locationGroup[l].get('Id') != viewModel.activeId()){
                        $html += '<li><span class="crumb" data-location="'+locationGroup[l].get('Id')
                        +'">'+locationGroup[l].get('Name')+'</span></li>';
                    }
                }
                $el.append($html);
            }
         };
        
        

        // helper for rendering an url-friendly arguments string
        // pass in arguments as props : { 'key' : 'value' }, static : { 'key' : 'value' }
        // where props are key/value pairs for url key and value is viewModel property value
        // and static is an object of literal arguments
        ko.bindingHandlers.urlArgs = {
            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                // This will be called when the binding is first applied to an element
                // Set up any initial state, event handlers, etc. here
                var value = ko.unwrap(valueAccessor());
                var args = '';
                if (value.static) {
                    $.each(value.static, function (key, value) {
                        args += key + '=' + value + '&';
                    })
                }
                if (value.props) {
                    $.each(value.props, function (key, value) {
                        args += key + '=' + bindingContext.$data[value]() + '&';
                    })
                }
                args = encodeURIComponent(args.slice(0, args.length - 1));
                var $el = $(element);
                $el.data('args', args);
                $el.attr('data-args', args);
                if (value.active && value.active == true) $el.addClass('active');
            },
        }

        // Helper for data-href property for controller submenu actions
        ko.bindingHandlers.subNav = {
            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                // This will be called when the binding is first applied to an element
                // Set up any initial state, event handlers, etc. here
                //var nav = bindingContext.$data.title() + '/';
                //var nav = valueAccessor().arguments
                var value = ko.unwrap(valueAccessor());
                var nav = value.controller() + '/' + value.action + '/';
                var $el = $(element);
                $el.data('href', nav);
                $el.attr('data-href', nav);
                if (bindingContext.$rawData.active == true) $el.addClass('active');
            },
            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                // This will be called when the binding is first applied to an element
                // Set up any initial state, event handlers, etc. here
                //var nav = bindingContext.$data.title() + '/';
                //var nav = valueAccessor().arguments
                var value = ko.unwrap(valueAccessor());
                var $el = $(element);
                if (bindingContext.$rawData.active == true) $el.addClass('active');
                else $el.removeClass('active');
            }
        }


 

    })();

});
