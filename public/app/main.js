/* global require, app, window, Backbone, DEBUG */
// Requiring 'modernizer' fires off modernizer's shim loader
require(["config"], function() {
    require(["Q", "datajs"], function(Q) {
        window.Q = Q;
    require(["breeze"], function(Q, breeze) {

        window.breeze = breeze;

    require(["app", "router", "lib/dataservice_mongo", "Q", "kbconfig", "modernizer", "jquery"],
        function(Application, Router, DataService, Q) {

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
        });
    });
    });
});