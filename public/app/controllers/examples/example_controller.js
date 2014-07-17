/* global define, console */
// Example Controller 
// ------------------

// The example file below illustrates the basic controller functionality/optoins.
define([
  'underscore',
  'backbone',
  'base/view',
  'base/controller',
  'views/shared/submenu_view',
  'app/templates/shared/layout_controller.html'
], function (_, Backbone, View, Controller, SubmenuView, template) {
    "use strict";

    // The controller will be initialized on a URL route match by Backbone.Router
    // Immediately after initialization, Backbone.Router will call the fn property
    // of the action matched by the URL route match, or the controller's default action
    var ExampleController = Controller.extend({

        // The title will be displayed in the default controller layout
        title: "Example Controller",



        // As usual, the start function will fire immediately after the standard backbone 
        // initialization function.  
        start: function () {
            _.bindAll(this, 'customLogic');
        },

        // Definition for controller layout.  Overwrite for more advanced/custom layouts
        // The example below adds an additional grid view to the content region
        // Make sure submenu is in your require for this controller if you plan on utilizing submenu
        // Note: To ensure controller layout is rendered before action sets view, pass in template
        // in require above (future patch will allow for paths at this controller level)
        layout: function () {
            this._layout = new View({
                el: "#main_content",
                template: _.template(template), // replace this template
                views: {
                    ".menu": this.getView("SubmenuView", SubmenuView, this)
                    // Define any additional views to initialize at controller start
                },
                createViewModel: function () {
                    return {};
                } // By default no observeables used
            });
            this._layout.render();
        },

        // To add logic or function helpers to be accessed from within the action.fn context,
        // best practice is to apply these helpers at the controller level.
        customLogic: function (args) {
            console.log('Hellow World');
        },

        // The controller extends Backbone.Model and as such can have defaults overridden
        // Controller model properties may be applicable for controller actions or helpers
        defaults: {
            // the index property is the default or index ACTION name for this controller
            index: 'index',
            actions: {
                index: {
                    // The name property is optional.  If included, the name will be displayed 
                    // as a sub-menu option.
                    name: "My Activity",
                    // The isVisible function will determine if this action should be visible in 
                    // the submenu.  This is executed on initialization and whenever
                    // this.buildMenuActions is executed.
                    isVisible: function (args) {
                        return true;// A boolean must be returned
                    },
                    // fn is required, and executed on URL route match by Backbone.Router
                    // This fn can also be called programmatically as required, but best practice
                    // for controller functions is that they are applied as per the customLogic() 
                    // example above.
                    fn: function (args) {
                        // The action function's primary design purpose is to set view content.
                        // Reference app/controllers/examples/initializing_views.js for more details                
                    }
                }
            }
        }
    });

    return ExampleController;
});