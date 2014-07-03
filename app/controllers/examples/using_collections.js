/* global define, app */
// Using Collections
// -----------------
// The below example controller is to assist with code examples and methods for:
//  - Creating collections utilizing Breeze data
//  - Creating collection views
//  - Initializing the Grid module
define([
  'underscore',
  'backbone',
  'base/view',
  'base/controller',
  'views/index/activity_item_grid_view',
  'modules/grid/grid_module'
], function (_, Backbone, View, Controller, ActivityItem, Grid) {
    "use strict";

    var BasicController = Controller.extend({

        title: "Activity Monitor",

        start: function (attributes, options) { 
            // To utilize a collection of breeze entities, utilize the app.api.getChildCollection method
            var activitiesCollection = app.api.getChildCollection('Activity');

            // Apply any queries/filters to your child collection.  For full documentation see:
            // http://bevry.me/queryengine/guide
            activitiesCollection.query();

            // In this example, the collection will be utilized across views, and as such is set as a variable
            // on the controller for easy access.
            this.set("activities", activitiesCollection );

            // Once the controller is created, executing a breeze query will actually fetch data.
            // Those models returning from our breeze query that match the filter/query criteria
            // for our childCollection (created above) will automatically pass in to our collection
            // NOTE: A Todo for an upcoming update is to combine this and the above method to initialize
            // one child collection with a breeze query (wherein the child collection sets as default query/filter
            // predicates passed within that breeze query) - for now, these two acts are performed separately
            app.api.getActivities({source: "Activities"});

            // In this example, the Grid will be utilized across multiple controller actions, so we intialize
            // it within our start function here and set it as a controller property for easy access.
            // For full documenation regarding grid initialization parameters, refer to app/modules/grid_module.js
            // Grid module utilizes http://rotundasoftware.github.io/backbone.collectionView/
            this.set('ActivityGrid', new Grid({
                title: 'Patient Activity',
                collection: this.get('activities'),
                columns: {
                    active: ['MemberName', 'Service'],
                    rename: {
                        'MemberName': 'Patient Name'
                    },
                    custom: [
                        {
                            name: 'Service E/T',
                            prop: '_vm_ElapsedTime'
                        },
                        {
                            name: 'Service Status',
                            prop: '_vm_Status'
                        },
                        {
                            name: 'RFS Time',
                            prop: '_vm_RFSTime'
                        },
                        {
                            name: 'Last Updated By',
                            prop: '_vm_LastUpdateBy'
                        }
                    ]
                },
                row: ActivityItem
            }));
        },

        defaults: {
            actions: {
                gridView: {
                    name: "Grid View",
                    fn: function (args) {
                        var ActivityGrid = this.get("ActivityGrid");

                        this.setView({
                            name: 'Activities',
                            view: ActivityGrid.getView() // this method returns the grid's view object
                        });

                        // The grid will render with the above setView method, here is an example of altering
                        // visible columns programmatically, note render is called to apply the column update
                        ActivityGrid.setActiveColumns([
                            'Physician Name',
                            'Service',
                            'Id',
                            'Appointment Id',
                            'Patient Name'
                        ]).render();
                       
                    }
                }
            }
        }
    });

    return BasicController;
});
