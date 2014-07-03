/* global define, app */
// View Initialization Examples
// ----------------------------

// This is an example controller utilized to illustrate the methods of 
// initializing views/models within the app.  Most view initializations will
// occur at the controller level (unless working within deeply nested views,
// or within modules)
define([
  'underscore',
  'backbone',
  'base/view',
  'base/controller',
  'views/examples/basic_view',
  'models/examples/entity_model',
  'models/examples/restful_model',
], function (_, Backbone, View, Controller, BasicView, EntityModel, RestfulModel) {
    "use strict";

    var ExampleController = Controller.extend({

        title: "Example Controller",

        defaults: {
          actions: {
            defined: {
              name: "Defined View",
              fn: function (args) {
                // Initialize/Render a defined view (as defined in the require function above)
                // Simply pass the defined view to this.setView
                // note: BasicView is defined above in the require statement
                // You can either pass a view instance, or a view definition.
                // In this example the definition is passed, and the setView function will create it
                // for you.
                this.setView(BasicView);
              }
            },
            dynamic: {
              name: 'On the Fly',
              fn: function(args){
                // Initialize/render a view on the fly
                // extend view properties as applicable.  This can extend base/view (as defined above)
                // or can extend any other defined view (that extends base/view).
                // note: the template can be a string and is fetched for rendering
                // Using a template string keeps the require function clean and defers getting the template
                // until actually required by an action/view when executed.
                this.setView(View.extend({
                  template: 'app/templates/examples/container.html'
                }));
              }
            },
            options: {
              name: 'Using Options',
              fn: function(args){
                // View options can be passed as normal to the view
                // In the example below, a breeze entityQuery is created and passed to the
                // view in the "breezeQuery" option.  If the view defined extends base/view,
                // this breezeQuery will be executed, and the resulting model will be used as
                // the underlying model for this view (the viewModel will be rebound on 
                // retrieval if the breeze entity must be fetched from the server).
                var id = (args.id) ? args.id : 3; // for demo purposes

                // NOTE: this is the entity query, it is NOT executed.  The execution will occur
                // when the view is initialized.
                var query = app.api.breeze
                  .EntityQuery
                  .from('Locations')
                  .expand('Parameters')
                  .where("Id", app.api.FilterQueryOp.Equals, id)
                  .using(app.api.manager);

                this.setView(new View({
                  breezeQuery : query
                }));
              }
            },
            // The options in the following example are advanced options.
            options2: {
              name: 'Options Part 2',
              fn: function(args){
                // The example below illustrates additional options that may be passed
                // to setView(). In this implementation, the view is passed in as 
                // the "view" property.
                // - name: If the name option is passed, this view will be named and this view
                // will persist.  This controller (which extends Backbone.Model), contains a property
                // called 'views', which is a backbone collection for any persistent views stored 
                // in this manner.  To access a named view, utilize this.getView("BasicView"). To see
                // all persisted views, use this.get('views'). If this view has already been initialized
                // when setView is called, this persisted view will be re-rendered and re-set to the zone.
                // NOTE: Utilizing a named view is an ADVANCED use case and should only be used as applicable.
                //
                // - zone: A jQuery selector for the zone in which to place this view.  This controller's
                // _layout property is an extension of Backbone Layout Manager.  Refer to the extension 
                // documentation for how regions are used.  By Default, the shared controller template has 
                // only a single ".content" view available.  In the instance you have overriden this template
                // with a custom template/layout for this controller, this zone property will be utilized
                // to insert your view to the desired region on the page.
                //
                // - view: This option can be accepted as either a view definition, or as a view instance.  If
                // using a named view (as the option below shows), it is proper practice to pass the view 
                // definition (as referenced in require function above or as a view.extend), as the view will
                // only then be created if the named view is not found within this.get('views');
                //
                // - options: Basic Backbone.View (or base/view) options.  These are passed directly into your
                // view.  Generally, you will initialize a new view and pass the options directly
                // (as shown in the previous example).  However, in the case wherein a named view
                // is used, the proper use is to provide a definition.  The options property here allows
                // for these options to be passed to this view if it has not yet been initialized.
                this.setView({
                  view: BasicView,
                  name: 'BasicView',
                  zone: '.right_column',
                  options: {
                    someOption: 'option value'
                  }
                });
              }
            },
            nestedViews: {
              name : 'Nested Views',
              fn: function(args){

                // If your view requires a more complex layout, or a composite of multiple
                //   views, utilizing View's built in layout manager functionality (View extends
                // backbone layout manager). */
                //
                // The example below shows declaring nested views via the "views" property.
                // By default, layout manager creates a composite dom structure from all associated
                // views passed in with the "views" property.  If your nested views have knockout
                // bindings, this will result in those bindings being applied multiple times.
                // If your nested views have knockout bindings, follow example #2 below (view2) */
                var view1 = new View({
                  template: 'app/templates/examples/container.html',
                  model: new Backbone.Model({ rows: 2, columns: 2}),
                  views: {
                    ".widget_content" : new View()
                  }
                });

                // This example shows that views can be inserted and independently rendered after 
                // your "wrapper" or parent view is created by layout manager's insertViews and
                // renderViews methods.  Overwrite base/view.js's renderComplete function (which
                // executes after rendering/binding) to insert and render child views.  This
                // method can also be used to apply child views dynamically. */
                var view2 = new View({
                  template: 'app/templates/shared/bootstrapGrid.html',
                  model: new Backbone.Model({ rows: 2, columns: 2}),
                  renderComplete: function(){
                    this.insertViews({
                      ".Row1_Cell1" : view1 
                    });
                    this.renderViews();
                  }
                });

                // When ready, utilize this.setView as normal, referencing just the parent view
                this.setView(view2);
              }
            },
            getRestfulModel: {
                name: "Restful Model",
                fn: function (args) {
                  // The example below illustrates creating a view on the fly
                  // with an associated restful model.  Refer to app/models/restful_model
                  // for details on the model itself.
                  var id = (args.id) ? args.id : 3; // for demo purposes

                  // As per regular Backbone specs, the model is passed as an option
                  // The view can be passed directly to setView as in previous examples
                  // or may be saved to a variable first as shown below.
                  var view = View.extend({
                    template: 'app/templates/examples/container.html',
                    model: new RestfulModel({
                      url: 'user.json?id=' + id
                    })
                  });

                  this.setView(view);

                }
            },
            getEntity: {
              name: "Entity Model",
              fn: function(args){
                  // This is the same essential illustration as the previous example,
                  // but shows the use of app/examples/entity_model 
                  var id = (args.id) ? args.id : 3; // for demo purposes

                  this.setView(new View({
                    template: 'app/templates/examples/list.html',
                    model: new EntityModel({id: id})
                  }));
              }
            }
          }
        }
    });

    return ExampleController;
});
