/* global define, console, app, FilterQueryOp */
// Example Entity Model
// --------------------

// This example model is to show the creation of a model that will
// apply custom properties and methods which may be needed to handle a
// breeze resouce.
// 
// This type of implementation may be applicable if additional logic
// and helper functions are needed for the handling of a breeze entity.
//
// To see an example of this model being initialized, refer to app/controllers/examples/initializing_views.js
define([
  'underscore',
  'backbone',
], function (_, Backbone) {
    "use strict";

    var Model = Backbone.Model.extend({

        defaults: {
            // While not required, declaring defaults is a proper standard
            // The below entity property will be populated with a Breeze 
            // entity as per our Breeze entity query.
            entity: null
        },

        initialize: function (options) {
            // Make sure to bind functions that require context
            // !! IMPORTANT !! - this will break your code if you do not include this
            // The only case where a function should not be bound is if it will never
            // require access to this model context.
            _.bindAll(this, 'getEntity', 'customLogic');

            // Create a standard breeze query
            var query = app.api.breeze
                .EntityQuery
                .from('Locations')
                .expand('Parameters')
                .where("Id", app.api.FilterQueryOp.Equals, options.id)
                .using(app.api.manager);

            // Use default app.api.get method, pass your query and applicable options.
            // Refer to dataservice.js for full options.
            app.api.get(query, {
                callback: this.getEntity
            });
        },

        getEntity: function (data) {
            // Set the entity property for this model and trigger a sync event,
            // emulating the change event chain as if the model was 'fetched'
            if (data.results) {
                // The below 'entity' is a reference to the default entity property above
                this.set('entity', data.results[0]);
                // Triggering sync will inform any views utilizing this model
                // to update their viewModels, allowing for data to be bound properly
                this.trigger('sync');
            }
            return this;
        },

        // Declare custom functions that this model may access.  !!Rememember to bind as applicable.!!
        customLogic: function (args) {
            console.log('Hooray, we have a custom logic function!');
        }

    });

    return Model;
});