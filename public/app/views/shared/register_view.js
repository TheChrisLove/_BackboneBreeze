/* global define, app, alert, $ */
define([
    'base/view',
    'text!templates/shared/bootstrapGrid.html'
], function(View, template) {
    "use strict";

    var LogInItem = View.extend({

        template: _.template(template),

        model: new Backbone.Model({
            rows: 3,
            columns: 1
        }),

        events: {
            "click .js-continue": "continue",
            "submit form": "login"
        },

        continue: function(e){
            console.log(e);

        },

        start: function() {
            //this.model.set("error_message", "");
            _.bindAll(this, 'register');
        },
        
        register: function(event, modal) {
            event.preventDefault();
        },

        renderComplete: function(){
           var views = {
                '.Row1_Cell1' : new View({ template: 'app/templates/shared/register.html'})
           }; 

           this.insertViews(views);
           this.renderViews();

        }

    });
    return LogInItem;
});