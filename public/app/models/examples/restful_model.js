/* global define, console */
// Example Restful Model
// ---------------------


// This is an example model that populates itself by fetch from a URL 
// the Defaults will populate until the server responds with the updated properties
//
// To see an example of this model being initialized, refer to app/controllers/examples/initializing_views.js
define([
  'underscore',
  'backbone',
], function (_, Backbone) {
    "use strict";

    var Model = Backbone.Model.extend({

        // URL is not populated by default.
        // The URL can be declared here, or it can also be passed in as an option
        // wherever the model is being extended/created (with new)
        // Refer to example controller to see an example of initializing a model
        // with a URL option (which will overwrite the existing URL here)
        // Url can be a string, but if it needs dynamic you will need to use a function
        url: function(){
            var url = this.get('url');
            return (url) ? url : 'user.json';
        },

        // Backbone by default will not fetch the URL for a model,
        // If this model should be populated with a server resource on intialize
        // the initialize function must call fetch()
        // Fetch will call the URL associated with this model by the URL property.
        initialize: function (attributes, options) {
            this.fetch();
        },

        defaults: {
            username: 'Default Username'
        },

    });

    return Model;
});