/* global define, console, app, EventSource, saveFailed, window, QueryEngine, Backbone, $ */
/**
 * Primary breeze dataservice.  Accessible via app.api
 * @module DataService
 */
define([
    'underscore',
    'breeze',
    'backbone', ,
    'saveQueuing',
    'metadata'
], function(_, breeze, backbone) {
    "use strict";

    /**
     * @constructor
     * @alias DataService
     * @property {Object} breeze - Reference to breeze library
     * @property {String} root - URL endpoint for the WebApi
     * @property {String} serviceName - URL endpoint for the breeze service in WebApi
     * @property {Object} manager - Breeze entity manager for this dataservice
     * @property {Object} Predicate - reference to breeze Predicate factory
     * @property {Object} FilterQueryOp - reference to breeze FilterQueryOp
     * @property {Object} collections - Object storing query engines for breeze entities
     * @property {Object} [collections.Locations] - Example format for an collection of Location entities
     * @property {Object} locationCollections -  Object storing query engines (filtered by active location)
     * for breeze entities
     */
    var DataService = function() {

        // Breeze / API Configuration 
        // --------------------------

        // Configure Breeze for Backbone (config'd for Web API by default)
        // This sets up breeze to return backbone style models
        breeze.config.initializeAdapterInstances({
            modelLibrary: "backbone"
        });

        // this.root used for ajax setup in non-breeze api calls
        this.root = (app && app.api_root) ? app.api_root : '/api';

        // Service name is route to the Web API controller (for breeze)
        var serviceName = this.serviceName = this.root + '/breeze/';


        // Setup Entity Manager
        // --------------------

        // Define the breeze dataservice
        var dataService = new breeze.DataService({
            serviceName: serviceName,
            // Comment out this line if you want to force metadata load
            hasServerMetadata: false // don't ask the server for metadata
        });

        // create and initialize the metadatastore from local metadata
        var metadataStore = new breeze.MetadataStore();
        // Comment out this line if you want to force metadata retrieval
        metadataStore.importMetadata(window.metadata);

        // manager is the common entity manager for regular data manipulations/caching
        // if you want data to persist in the application, use persistentManager
        var manager = this.manager = new breeze.EntityManager({
            dataService: dataService,
            metadataStore: metadataStore
        });
        // Enable saveQueueing
        manager.enableSaveQueuing(true);

        // persistentManager is never cleared unless by a manual trigger.  Use with caution and only
        // for data that is expected to exist over the lifecycle of the application.
        var persistentManager = this.persistentManager = new breeze.EntityManager({
            dataService: dataService,
            metadataStore: metadataStore
        });

        // Dataservice Properties
        // ----------------------

        // Setup references to Breeze and Breeze methods 
        this.breeze = breeze;
        this.Predicate = breeze.Predicate;
        this.FilterQueryOp = breeze.FilterQueryOp;


        // Dataservice Query Engine and Local Cache
        // ----------------------------------------

        // Master query engine collection object, each entity type will derive 
        // child collections from this. Backbone.Collection will not allow for conflicting Ids,
        // thus this.entities will hold a reference to a collection for each entity type
        // For example: this.entities.Activities = (Query Engine Collection)
        // https://github.com/bevry/query-engine
        this.collections = {};
        this.locationCollections = {};
        this.persistantCollections = {};

        this.changeManager = function(changeArgs, persist) {
            if (changeArgs.entityAction.name == 'Clear') {
                var collections = (persist) ? this.persistantCollections : this.collections;
                $.each(collections, function(key, value) {
                    value.reset([]);
                });
            } else if (changeArgs.entity.entityAspect.entityState.isDeleted() || changeArgs.entity.entityAspect.entityState.isDetached()) {
                // This code will be executed any time any entity within the entityManager is added, modified, deleted or detached for any reason. 
                // Rerun our query on applicable collection to update any filters (including default filter for detached/deleted)
                app.api.getCollection(app.api.getEntityName(changeArgs.entity), persist).query();
                // Mark the pending deletion.  If reject changes are called we will need this as a reference to re-instate this entity
                // in it's collection.
                changeArgs.entity._disposed = true;
            } else if (
                (changeArgs.entityAction.name === "AttachOnQuery") ||
                (changeArgs.entityAction.name === "Attach")
            ) {
                var entityInfo = app.api.getEntityInfo(changeArgs.entity);
                if (entityInfo) {
                    app.api.getCollection(entityInfo.shortName, persist).add(changeArgs.entity);
                }
            } else if (changeArgs.entity._disposed) {
                app.api.getCollection(app.api.getEntityName(changeArgs.entity), persist).add(changeArgs.entity);
                changeArgs.entity._disposed = false;
            }
        };

        this.syncManager = function(changeArgs, manager) {
            var shortName = app.api.getEntityName(changeArgs.entity);
            var getEntity = manager.getEntityByKey(shortName, changeArgs.entity.id);
            if (getEntity) {
                getEntity.set(changeArgs.entity.toJSON()).entityAspect.acceptChanges();
            }
        };

        this.clear = function(manager) {
            var entities = manager.getEntities();
            manager.rejectChanges();
            manager.clear();
            for (var i = 0; i < entities.length; i++) {
                entities[i].stopListening();
                entities[i].entityAspect = null;
            };

        };

        // Setup subscription to manage collections on entity change
        // Currently primary purpose is to manage deletions, detachments
        manager.entityChanged.subscribe(function(changeArgs) {
            app.api.changeManager(changeArgs);
            if (changeArgs.entityAction == 'MergeOnSave') app.api.syncManager(changeArgs, app.api.persistentManager);
        });
        persistentManager.entityChanged.subscribe(function(changeArgs) {
            app.api.changeManager(changeArgs, true);
            if (changeArgs.entityAction == 'MergeOnSave') app.api.syncManagers(changeArgs, app.api.manager);
        });

        /**
         * Returns a query engine for specified resource which tracks entities of resource type
         * extant in the entityManager
         * @param {String} shortName - shortname for resource to be retrieved (ie. 'Location')
         * @param {Boolean} persist - Return a child collection from persistent collections
         * @returns {Collection} Live QueryEngine populated with specified resource
         */
        this.getCollection = function(shortName, persist) {
            var collections = (persist) ? this.persistantCollections : this.collections;
            if (!collections[shortName]) {
                collections[shortName] = new QueryEngine.createLiveCollection()
                    .setFilter('suppressDeletedDetached', function(model) {
                        if (model.entityAspect && model.entityAspect.entityState) {
                            var state = model.entityAspect.entityState;
                            if (state.isDeleted() || state.isDetached()) return false;
                            else return true;
                        }
                        return false;
                    });
            }
            return collections[shortName];
        };

        /**
         * Helper(shortcut) method for intializing a child collection from this.collections
         * @param {String} shortName - shortname for resource to be retrieved (ie. 'Location')
         * @param {Boolean} persist - Return a child collection from persistent collections
         * @returns {Collection} new Live Child QueryEngine populated with specified resource
         */
        this.getChildCollection = function(shortName, persist) {
            return this.getCollection(shortName, persist).createLiveChildCollection();
        };

        /**
         * Get a collection based on the currently active collection.  Builds a queryEngine child from this.collections
         * with a filter for locationId applied.
         * @param {String} shortname - Name of the entity type to get collection for
         * @returns {Collection} new Live Child QueryEngine populated with specified resource
         */
        this.getLocationCollection = function(shortName) {
            if (!this.locationCollections[shortName]) {
                var queryEngine = this.locationCollections[shortName] = this.getCollection(shortName).createLiveChildCollection();
                queryEngine.setFilter('filterByLocation', this._filterByLocation);
                // Even if there is no active location, returning null here will mean that each record will fail (so no locaiton, no data)
                queryEngine.setSearchString(shortName + ':' + app.location.get('active')).query();

                // Setup subscription to location change
                queryEngine.listenTo(Backbone.EventBroker, "location:change", function(event) {
                    this.setSearchString(shortName + ':' + event.LocationId).query();
                });

            }
            return this.locationCollections[shortName];
        };

        /**
         * Filter function to apply to each locationCollection.  Allows locationCollection to return only those
         * models applicable to the collection.
         * @private
         * @param {Backbone.Model} model - Model to be checked
         * @param {String} searchString - pill (key:value) to compare against
         */
        this._filterByLocation = function(model, searchString) {
            if (searchString) {
                var args = searchString.split(':')[1];
                var shortName = args[0];
                // TODO update this method to reference shortName above (ex: Location)
                // to determine what property to use
                var thisId = (model.get('LocationId')) ? model.get('LocationId') : model.get('ParentId');
                return thisId == parseInt(args);
            } else {
                return true;
            }
        };

        // Import data from local storage
        // TODO: Define and setup conditions in which this is performed
        if (true === false) {
            var importData = window.localStorage.getItem('ESS_Entities');
            if (importData) this.manager.importEntities(importData);
        }

        // By default, stash data for offline or for easy access on refresh
        // TODO: Not currently being utilized
        window.onbeforeunload = function(event) {
            var exportData = app.api.manager.exportEntities();
            window.localStorage.setItem('ESS_Entities', exportData);
            //return 'Please dont leave!';
        };

        // Dataservice API
        // ---------------

        /**
         *  Helper function for returning entity info for a given model
         * @param {Backbone.Model} model - Breeze entity to be examined
         * @returns {Object} entityInfo - Object with information applicable to the referenced entity
         * @returns {Object} entityInfo.entityManager - reference to entities entity manager
         * @returns {String} entityInfo.shortName - entitie's shortName
         * @returns {Object} entityInfo.entityType - entitie's entityType
         */
        this.getEntityInfo = function(model) {
            var entityInfo = {};
            if (model.entityAspect) {
                entityInfo.entityManager = model.entityAspect.entityManager;
                entityInfo.shortName = model.entityAspect.entityGroup.entityType.shortName;
                entityInfo.entityType = entityInfo.entityManager.metadataStore.getEntityType(entityInfo.shortName);
            }
            return entityInfo;
        };

        /**
         * Default method for retrieving data.
         * @param {Object} query - instanceof breeze.entityQuery
         * @param {Object} [context=args] - context to run the success function in
         * @param {Object} [args] - Arguments for reference within querySucceeded and callback (if applicable)'
         * @param {Boolean} [args.refresh] - if true, will refresh data regardless of results in local cache
         * @param {Function} [args.callback] - callback to fire on query success
         * @param {Function} [args.then] - callback to fire on query success (directly after callback)
         * @param {Object} [args.gritter] - Data to reference to create a gritter message
         * @param {Object} [args.gritter.success] - Gritter title/text object to pass to ritter (for success messaging)
         * @param {Object} [args.gritter.fail] - Gritter title/text object to pass to ritter (for failure messaging)
         */
        this.get = function get(query, args, context) {
            return Q.fcall(function(query, args, context) {
                var local, data, success, failure;
                if (!args) args = {};
                if (context) {
                    success = _.bind(querySucceeded, context);
                    failure = _.bind(queryFailed, context);
                } else {
                    success = _.bind(querySucceeded, args);
                    failure = _.bind(queryFailed, args);
                }
                // TODO impelment using based on active module ?
                // only implement this conditionally
                if (!query.entityManager) {
                    var manager = (app.info.getActive().get('persist') === true) ? app.api.persistentManager : app.api.manager;
                    query = query.using(manager);
                }

                // TODO double think about this pattern,
                // Is it more optimal to request all the time refresh, assuming local, or vice versa
                // Only look locally if a predicate has been applied
                try {
                    if (args.refresh || !query.wherePredicate) {
                        query.execute().then(success).fail(failure);
                    } else {
                        local = query.entityManager.executeQueryLocally(query);
                        if (local.length === 0) query.execute().then(success).fail(failure);
                        else success({
                            inlineCount: local.length,
                            results: local
                        });
                    }
                } catch (err) {
                    // if the above returned an error, it is likely due to missing metadata 
                    query.execute().then(success).fail(failure);
                }
            }, query, args, context)
        };

        /*
         * Save Changes
         * @param {Array.<Backbone.Model>} [entities] - Entities to save changes on.  If absent, save all changes.
         * @param {Function} [args.callback] - callback to fire on save success
         * @param {Function} [args.then] - callback to fire on save success (directly after callback)
         * @param {Object} [args.gritter] - Data to reference to create a gritter message
         * @param {Object} [args.gritter.success] - Gritter title/text object to pass to ritter (for success messaging)
         * @param {Object} [args.gritter.fail] - Gritter title/text object to pass to ritter (for failure messaging)
         */
        this.saveChanges = function saveChanges(entities, args, context) {
            var success, failure;
            if (manager.hasChanges()) {
                if (!args) args = {};
                if (context) {
                    success = _.bind(querySucceeded, context);
                    failure = _.bind(queryFailed, context);
                } else {
                    success = _.bind(querySucceeded, args);
                    failure = _.bind(queryFailed, args);
                }

                return manager.saveChanges(entities, args.options, success, failure).fail(failure);
            }
        };

        // Default Success/Failure Handling
        // --------------------------------

        /**
         * Default failure function to handle query failure
         * @private
         */
        var queryFailed = this.queryFailed = function(response) {
            if (this.gritter && this.gritter.fail) $.gritter.add(this.gritter.fail);
            if (this.fail) this.fail(response);
            console.log('Ouch!');
            console.log(response);
        };

        /**
         * Default success function to handle query success
         * @private
         */
        var querySucceeded = this.querySucceeded = function(data) {
            var entityInfo, results = (data.results) ? data.results : data.entities;
            if (this.callback) return this.callback(data, this);
            if (this.then) this.then(data, this);
            if (this.gritter && this.gritter.success) $.gritter.add(this.gritter.success);
            return data;
        };

        // Dataservice subscription Handling
        // ---------------------------------

        /**
         * Currently only being used by getActivities, which is deprecated
         * TODO: Update this to act as one global listener
         * @private
         */
        this.subscribe = function(args) {

            var source = new EventSource(args.subscribe.resource);
            source.addEventListener('message', function(e) {
                var json = JSON.parse(e.data);
                if (args.subscribe && args.subscribe.callback) args.subscribe.callback(json, args);
            }, false);

            source.addEventListener('open', function(e) {
                console.log("open!");
            }, false);

            source.addEventListener('error', function(e) {
                if (e.readyState == source.CLOSED) {
                    console.log("error!");
                }
            }, false);

            if (args.subscribe && args.subscribe.onOpen) args.subscribe.onOpen(args);

        };

        // Breeze Entity Validation Methods
        // --------------------------------

        // getErrorMessage, getValidationMessages, getMessageFromEntityError, getEntityName were taken from http://www.breezejs.com/documentation/saveerrorextensionsjs and updated.

        /**
         *  Function to get error message during failed event in breeze save changes method.
         * @param {Object} error - breeze error object
         * @returns {String} error validation messages (separated by <br/>)
         */
        this.getErrorMessage = function(error) {
            var msg = error.message;
            var entityErrors = error.entityErrors;
            if (entityErrors && entityErrors.length) {
                return this.getValidationMessages(entityErrors);
            }
            return msg;
        };

        /**
         * Helper function for getErrorMessage
         * @private
         * @param {Object} entityErros - entityErrors object
         */
        this.getValidationMessages = function(entityErrors) {
            var getMessageFromEntityError = _.bind(this.getMessageFromEntityError, this);
            var isServerError = entityErrors[0].isServerError; // if the first is, they all are     
            try {
                return entityErrors.map(getMessageFromEntityError).join('; <br/>');
            } catch (e) {
                /* eat it for now */
                return (isServerError ? 'server' : 'client') + ' validation error';
            }
        };

        /**
         * Helper for getValidateMessages
         * @private
         * @param {Object} entityError - entityError object
         * @returns {String} error message from
         */
        this.getMessageFromEntityError = function(entityError) {
            var name, entity = entityError.entity;
            if (entity) {
                name = this.getEntityName(entity);
            }
            name = name ? name += ' - ' : '';
            //We can probably stop the display of entity name in UI
            return name + '\'' + entityError.errorMessage + '\'';
        };

        /**
         * Helper for getMessageFromEntityError, but also useful for retrieving entity name
         * @param {Backbone.Model} entity - Breeze entity
         * @returns {String} entity shortName
         */
        this.getEntityName = function(entity) {
            var key = entity.entityAspect.getKey();
            var name = key.entityType.shortName;
            return name;
        };

        /* Specific API calls */
        // These should be deprecated/removed

        // TODO update/remove this with inclusion of global subscribe
        this.getActivities = function(args) {
            //TODO update subscribtion to occur first and get collection on promise
            var success = _.bind(this.querySucceeded, args);
            var getSubscription = _.bind(this.subscribe, args);
            //var source = (args.source) ? args.source : "Gettblappointments";
            args.subscribe = {
                resource: this.root + '/api/Activity/GetActivityUpdates',
                callback: function(data, args) {
                    // todo handle arrays?
                    console.log('subscription callback');
                    console.log(data);
                    var activity = args.ref.get(data.ActivityId);
                    if (activity) {
                        data.Activity = activity;
                        var entityInfo = app.api.getEntityInfo(activity);
                        // TODO double check if entity is already added that breeze handles this properly
                        var activityDetail = entityInfo.entityManager.createEntity("ActivityDetail", data);
                        //activity.get('ActivityDetails').push(activityDetail)
                        activity.trigger('change:ActivityDetails', [activityDetail]);
                    }
                },
                onOpen: function(args) {
                    console.log('fetching breeze');
                    return this.breeze.EntityQuery
                        .from("Activities")
                        .expand("ActivityDetails")
                        .take(args.limit)
                        .using(manager)
                        .execute()
                        .then(success)
                        .fail(queryFailed);
                }
            };
            this.subscribe(args);
        };

        // API helpers
        // -----------

        /**
         * Retrieves entityType based on resource name
         * @param {String} resourceName - resource name (shortName ie ValueItems)
         * @returns {EntityType} entityType for resource
         */
        this.getEntityTypeByResource = function(resourceName) {
            app.api.manager.metadataStore.getEntityType(app.api.manager.metadataStore.getEntityTypeNameForResourceName(resourceName))
        };

        /**
         * Tests a predicate against a collection and returns those models that have passed
         * @param {Array|Backbone.Collection} collection - Array of entities or backbone collection
         * @param {Predicate} predicate - Breeze Predicate to test against
         * @returns {Array} passed - entities that have passed the predicate
         */
        this.applyPredicate = function(collection, predicate) {
            var evaluate = (collection.models) ? collection.models : collection;
            var passed = [];
            for (var i = 0; i < evaluate.length; i++) {
                if (this.validatePredicate(evaluate[i], predicate)) passed.push(evaluate[i]);
            }
            return passed;
        };

        this._getPredicateProperty = function(model, name) {
            var prop = model;
            if (name.match(/\./)) {
                var _name = name.split('.');
                for (var i = 0, ii = _name.length; i < ii; i++) {
                    if (prop) prop = prop.get(_name[i]);
                }
            } else return model.get(name);
            return prop;
        },

        /**
         * Tests an entity against a predicate
         * @param {Model} model - Backbone.Model to test against
         * @param {Predicate} predicate - Breeze Predicate to test against
         * @returns {Boolean}
         */
        this.validatePredicate = function(model, predicate) {
            var pass, comparator, evaluated = [];

            // If compound predicate, will have booleanQueryOp
            comparator = (predicate._booleanQueryOp && predicate._booleanQueryOp.name) ? predicate._booleanQueryOp.name : predicate._filterQueryOp.name;

            // If we have child predicates to evaluate, run those first...
            if (predicate._predicates || _.isObject(predicate._value) && !_.isDate(predicate._value)) {

                // Check if we need to validate on related properties
                if (predicate._propertyOrExpr) {
                    // Need to check for nested properties
                    var collection = app.api._getPredicateProperty(model, predicate._propertyOrExpr);

                    // It is possible predicate could be applying to a relationship that
                    // is not expanded. In this case appending the predicate with ignore
                    // will bypass validation on that predicate.
                    if (!collection && !predicate._ignore) return false;
                    else if (predicate._ignore) return true;

                    if (!collection.length) collection = [collection];

                    evaluated = this.applyPredicate(collection, predicate._value);

                    switch (comparator) {
                        case 'Not':
                            return (evaluated.length == 0);
                            break;
                        case 'Or':
                        case 'Any':
                        case 'Some':
                            return (evaluated.length > 0);
                            break;
                        case 'And':
                        case 'All':
                        case 'Every':
                            return (evaluated.length == collection.length);
                            break;
                    }
                }

                var evaluate = predicate._predicates;
                // Set this up as an array for consistency
                evaluate = (evaluate.length) ? evaluate : [evaluate];

                for (var p = 0; p < evaluate.length; p++) {
                    evaluated.push(this.validatePredicate(model, evaluate[p]));
                }

                switch (comparator) {
                    case 'Not':
                        pass = ($.inArray(true, evaluated) >= 0) ? false : true;
                        break;
                    case 'Or':
                    case 'Any':
                    case 'Some':
                        pass = ($.inArray(true, evaluated) >= 0) ? true : false;
                        break;
                    case 'And':
                    case 'All':
                    case 'Every':
                        pass = ($.inArray(false, evaluated) >= 0) ? false : true;
                        break;
                }
                return pass;
            }

            // If the above is skipped, we are in the context of a single predicate with no children (lowest level)
            //var prop = model.get(predicate._propertyOrExpr);
            var prop = app.api._getPredicateProperty(model, predicate._propertyOrExpr)

            // Add a space in the instance that prop is a typeof number
            var _prop = prop + '';
            var value = predicate._value;

            // TODO implement date comparison
            if ((comparator == 'Equals') || (comparator == 'GreaterThan') || (comparator == 'LessThan')) {

            }

            switch (comparator) {
                case 'Equals':
                    return prop == value;
                    break;
                case 'NotEquals ':
                    return prop != value;
                    break;
                case 'GreaterThan':
                    return prop > value;
                    break;
                case 'LessThan':
                    return prop < value;
                    break;
                case 'GreaterThanOrEqual ':
                    return prop >= value;
                    break;
                case 'LessThanOrEqual ':
                    return prop <= value;
                    break;
                case 'Contains':
                    return (_prop.indexOf(value) != -1);
                    break;
                case 'EndsWith':
                    return (_prop.indexOf(value, prop.length - value.length) !== -1);
                    break;
                case 'StartsWith':
                    return (_prop.indexOf(value) == 0);
                    break;
                default:
                    console.log('Evaluation for predicate type' + comparator + 'to be implemented.');
                    return false;
                    break;
            }
        }

    };

    return DataService;

});