/* global require, app, window, Backbone, DEBUG */
// Requiring 'modernizer' fires off modernizer's shim loader
require(["config"], function() {
    require(["app", "router", "lib/dataservice", "Q", "models/location", "modernizer", "jquery",
        "base/view", "text!templates/examples/container.html", "obscura"
    ], function(Application, Router, DataService, Q, Location,
        View, template, Obscura
    ) {

        if (BUILD_APP == true) {

            // Application Initialization
            // --------------------------

            // Initialize application object
            // - Serves as a central point of reference for persistent objects
            // - Initializes global extensions
            // - Defines application defaults
            window.app = new Application();

            // Assign global reference to Q (used by breeze and others relying on promise)
            window.Q = Q;

            // Initialize dataservice object - most Breeze/Ajax calls will be routed through this dataservice
            app.api = new DataService();

            // Initialize app location object
            app.location = new Location();

            /** @todo remove this - temporarily applied for easier development/testing */
            if (DEBUG === true) {
                app.user.set({
                    username: "Kitty",
                    password: "Aa123456",
                    userId: "123"
                });
                app.user.login();
            }

            // Define your master router on the application namespace.  Will handle all navigation.
            app.router = new Router();

            // Trigger the initial route and enable HTML5 History API support. 
            // Default 'index' location/controller is not set here, but in app.info.get('home')
            // - On initialization, the router will begin at app.root and navigate to app.info.get('home')
            Backbone.history.start({
                pushState: false,
                root: app.root
            });
        } else {

            $(document).ready(function() {


                var populate = window.populate = function populate(count, add) {
                    var adds = [];
                    while (count--) {
                        adds.push({
                            firstName: count,
                            lastName: count + 'prop2'
                        });
                    }

                    if (add) employees.add(adds);
                    else employees.reset(adds);
                }

                var Employee = Backbone.Model.extend({});
                var _Employees = Backbone.Collection.extend({
                    model: Employee
                });

                var Employees = new Obscura(_Employees);

                var employees = window.employees = new Employees();

                var EmployeeView = Backbone.View.extend({

                    template: _.template($("#employee-template").html()),

                    render: function() {
                        var emp = this.model.toJSON();
                        var html = this.template(emp);
                        this.$el.append(html);
                    }
                });

                var emptyListCaptionCollectionView = window.emptyListCaptionCollectionView = new Backbone.CollectionView({
                    el: $("#demoEmptyListCaption"),
                    selectable: true,
                    selectMultiple: true,
                    sortable: true,
                    emptyListCaption: "There are no items in this list.",
                    collection: employees,
                    modelView: EmployeeView
                });

                emptyListCaptionCollectionView.render();


            });

        }
    });
});