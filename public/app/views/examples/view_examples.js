/* global define, app, $, someViewModel */
// Extending the Base View
// -----------------------

// This view is to provide illustrative examples of view customization */
// Copy and paste functionality as applicable, but ensure attention is paid
// to comments.  Implementing a view with conflicting methods (conflicting
// methods are shown here as part of illustrative examples) will cause issues. 
//
// For examples of view initialization, refer to app/controllers/examples/initializing_views.js
define([
  'underscore',
  'backbone',
  'base/view',
  'knockback',
  'knockout',
  'text!templates/examples/container.html'
], function (_, Backbone, View, kb, ko, template) {
    "use strict";

    var BasicView = View.extend({

        template: _.template(template),

        // The start function fires after the view's initialize function,
        // and can be utilized to add view initialization logic without 
        // overriding base/view initialization logic. 
        start: function(){
          // Example usage might be binding custom function(s)
          // if view context is needed within the function 
          _.bindAll(this, 'myHoverFunction', 'myClickFunction');
        },

        // Events
        // ------

        // Refer to Backbone docs for further details on events object 
        events: {
            'click .someClass' : 'myClickFunction',
            'mouseenter .someOtherClass' : 'myHoverFunction',
            'mouseleave .someOtherClass' : 'myHoverFunction'
        },

        // Example usage of hover in/out using Backbone view eventing 
        myHoverFunction: function(event){
            switch(event.type){
              case 'mouseenter' :
                  $(event.currentTarget).addClass('hovering');
              break;
              case 'mouseleave' : 
                  $(event.currentTarget).removeClass('hovering');
              break;
            }
        },

        // This basic click event function illustrates a few view fundamentals 
        myClickFunction: function(event){
          // Access model properties
          var modelProperty = this.model.get('someProperty');

          // Access viewModel properties
          // viewModelProperties are either ko obsservables, kb observables, or viewModels
          var viewModelProperty = this.viewModel.viewModelProperty();

          // Access an element contained within the DOM associated with this view
          // Never use IDs in your HTML as elements are easily accessible when scoped properly
          var $element = this.$el.find('.someClass');

          // passed in event is a standard jquery event
          var clickSource = $(event.currentTarget);
        },

        // Customizing the View Model
        // --------------------------

        // The viewModel is created during initialization and can be updated later.
        // By default, all model properties will be pulled into the viewModel.
        // This core function can be overwritten to provide a custom viewModel 
        // with exclusions, remapping, computed properties, and more. */
        createViewModel: function (options) { 
            // The viewModel will be accessible on the model through this.viewModel
            // when your within context of the view.  
            // When within context of the view, this.model is a reference to this view's
            // associate Backbone.Model
            var viewModel, _this;
            // this function must return a viewModel

            // This default implementation passes view options and creates a viewModel
            // based on these options and all the model properties of associated model.
            // Accepts the same options as kb.viewModel.
            // This function resides in base/view.js, and utilizes knockback (kb.viewModel) 
            // in conjunction helper functions to create observeables on breeze array
            // and other advanced functionality as applicable to options passed to the view
            // (refer to "Creating Custom/Advanced ViewModels" below for details)
            viewModel = this._createViewModel(options);

            // The default Knockback viewModel factory can also be utilized if the model
            // utilized by the view is properly structured with nested models/collections.
            // Breeze entities however use arrays not collections, and as such the Knockback
            // viewmodel factory would not be sufficient (the _createViewModel function will
            // allow for Breeze entity property arrays to be observed).  Make sure kb is defined. */
            viewModel = kb.viewModel(this.model);

            // A custom viewModel can also be returned.  Useful if you just want to create something
            // simple from scratch, or if the view has no model.
            // Knockback and Knockout can be used interchangeably in this context as applicable,
            // as a rule of thumb, consider the following guidelines when chooseing knockback vs. knockout
            // - If the observeable is to be synced with a this.model property, use KNOCKBACK
            // - If the observeable should not reference/sync with this.model, use KNOCKOUT
             viewModel = {
                // You can use kb and ko as applicable and in concert with eachother within the viewmodel
                // username is created as a knockout observable (will have no link to any backbone model)
                username: ko.observable('A username'),
                // displayname is created with knockback, and will sync with this.model 
                displayname: kb.observable(this.model, 'displayname')
             };

            // Adding/appending Knockback observeables:
            // The following two examples may be applicable in the scenario above, wherein a viewModel
            // is created from scratch without using _createViewModel() or kb.viewModel().
            // To add/append model properties to an existing viewModel, either append the existing viewModel
            viewModel.customProperty = kb.observable(this.model, 'someValue');
            // OR use knockback viewModel factory to extend the viewModel
            kb.viewModel(this.model, 'userId', viewModel);

            // Adding/appending Knockout observeables:
            // The following illustrates adding a knockout observeable to the viewModel. 
            // This may be applicable for computed properties which reference model properties,
            // or for properties created by or used only for the view (and need not be tracked 
            // on the view's model (this.model)).
            // To add/append custom properties (not referencing this.model), use knockout
            // ko.computed can be used interchangeably with ko.observable below
            viewModel.knockoutProperty = ko.observable('This is bound with knockout');

            // Creating Custom and Advanced View Models
            // ----------------------------------------
            
            // The below are some examples of options that can be passed to _createViewModel.
            //  For a full list of options, refer to Knockback viewModel API documentation. 
            // These options should be utilized primarily for advanced use cases.

            // To exclude certain properties, use the excludes option
            // This is a knockback option, refer to knockback docs for details
            viewModel = this._createViewModel({
              excludes : ['aPropertyName', 'anotherPropertyName']
            });
            
            // Creating a viewModel with options:
            // In addition to the options that can be passed to kb.viewModel, 
            // custom properties can be created in bulk via utilizing the custom option.
            viewModel = this._createViewModel({
              custom : [
                'someProperty', // if an entry is a string, it will be initialized with null value
                { 
                  name: 'anotherProperty', // If an object, use name/value
                  value: 'anotherProperyValue'
                },
                {
                  name: 'thirdProperty', // functions can also be used to create value
                  value: (function(){return 'thirdPropertyValue';})()
                },
                {
                  name: 'fourthProperty', // or functions can be referenced
                  value: this.someFunction
                }
              ]
            });

            // To include a viewModel reference to another viewModel:
            // This is applicable when this view requires access to the context of 3rd party viewModel
            viewModel = this._createViewModel({
              vm_related: {
                key : 'relatedVmPropertyName', // this will be the name of the viewmodel property
                vm  : someViewModel // the reference to your desired viewModel
              }
            });

            // To create a viewModel scoped to a nested property:
            // Backbone Nested Model is also supported (use the nested model get/set syntax)
            // This is ADVANCED usage, utilize as applicable
            viewModel = this._createViewModel({
              vm_model_context: function(){
                return _this.model.get('nestedObject_or_nestedBackboneObject');
              },
              address: 'nestedObject' // The property name of the nested object
            });

            // A viewModel needs to be returned from this function
            return viewModel;
        },

        // Rendering the View
        // ------------------

        // Overwrite beforeRender, afterRender, or renderComplete to apply functionality before/after render

        // Fires before render... simple.
        beforeRender: function(){},
        
        // Fires immediately after render.
        afterRender: function () {
            // this.renderBindings() applies/resets knockout bindings as applicable if a 
            // viewModel is present on the view.  This should only be overwritten for 
            // custom knockout binding logics (should not be necessary)
            this.renderBindings();

            // Sometimes you want to piggy back off of the afterRender function, which may have extant logic you
            // do not want to copy or duplicate in your function.  
            this.renderComplete();

            // To apply validation rules, utilize this.trackValidation()
            // Pass jQuery Validate (extension) validate object to initialize validation
            // in your view's form.
            // Make sure that your submit action checks the following: (below snippet existing in context of view)
            // if(!this.$el.find('form').valid()) return false; // where return ceases execution of the submit function
            this.trackValidation({
                rules: {
                    // simple rule, converted to {required:true}
                    Name: "required",
                    DisplayName: "required"
                    // compound rule example
                    /*
                    example: 
                      email: {
                        required: true,
                        email: true
                      }
                    */
                }
            });
        },

        // By default this function is completely empty, and simply fires after afterRender.  This is the easiest function to overwrite
        // without worrying about breaking any extant functionality.
        renderComplete: function(){}
    });

    return BasicView;
});
