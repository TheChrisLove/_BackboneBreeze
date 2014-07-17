define([
  'underscore',
  'backbone',
  'lib/mongodb_metadata',
  'mongodb'
  ], function(_, backbone, Metadata) {
  "use strict";

var DataService;
DataService = function(){


  
    var metadata = new Metadata();



    breeze.config.initializeAdapterInstance("dataService", "mongo", true);
    


    // configure Breeze for Backbone (config'd for Web API by default)
    // this sets up breeze to return backbone style models
    breeze.config.initializeAdapterInstances({modelLibrary: "backbone"});
    //breeze.config.initializeAdapterInstance("modelLibrary", "backingStore", true);

    // Shortcut to breeze predicate to avoid having to include breeze all over the app
    this.Predicate = breeze.Predicate;

    // used for non-breeze api calls
    this.root = '/';
    // service name is route to the Web API controller (for breeze)
    var serviceName = '/';

    this.breeze = breeze;
    // manager (aka context) is the service gateway and cache holder
    var serverAddress = '/breeze/zza';
    //var manager = this.manager = new breeze.EntityManager(serverAddress);
    var _this = this;
    this.EntityCollection = new QueryEngine.QueryCollection([], { live: true});

    window.FilterQueryOp = this.breeze.FilterQueryOp;

    // Define the breeze dataservice
        var dataService = new breeze.DataService({
            serviceName: serverAddress,
            // Comment out this line if you want to force metadata load
            hasServerMetadata: false // don't ask the server for metadata
        });

        // create and initialize the metadatastore from local metadata
        var metadataStore = new breeze.MetadataStore();

        // Comment out this line if you want to force metadata retrieval
        var metadata = new Metadata();
        metadataStore.importMetadata(metadata.exportMetadata());

        var manager = this.manager = new breeze.EntityManager({
            dataService: dataService,
            metadataStore: metadataStore
        });



    
    // default failure/success functions
    var queryFailed = this.queryFailed = function(error){
        console.log(error);
    };

    // requires args.resource and args.callback
    this.subscribe = function (data, args) {

        var source = new EventSource(args.subscribe.resource);
        source.addEventListener('message', function (e) {
            var json = JSON.parse(e.data);
            if(args.subscribe && args.subscribe.callback) args.subscribe.callback(json, args);
        }, false);

        source.addEventListener('open', function (e) {
            console.log("open!");
            console.log(e);
        }, false);

        source.addEventListener('error', function (e) {
            if (e.readyState == source.CLOSED) {
                console.log("error!");
            } 
        }, false);
    };

    var querySucceeded = this.querySucceeded = function(data){
        if(this.ref){
            if(this.ref.models){
                for (var i = 0; i < data.results.length; i++) {
                    this.ref.add(data.results[i]);
                }
            } else {
                this.ref.attributes = data.results[0].attributes;
            }
        }
        _this.EntityCollection.add(data.results);
        if (this.subscribe) this.subscribe.getSubscription(data, this);
        if (this.callback) return this.callback(data, this);
        return data;
    };

    this.custom = function(args){
        var success = _.bind(this.querySucceeded, args);

        return breeze.EntityQuery
            .from('Weapons')
            .select('Name', 'Group')
            .using(manager)
            .execute()
            .then(success)
            .fail(queryFailed);

    };

    this.get = function(query, args){
        var local, data;
        var success = _.bind(this.querySucceeded, args);
        try{
           local = app.api.manager.executeQueryLocally(query);
           if(local.length == 0) query.execute().then(success).fail(queryFailed);
           else success({results: local});
        } catch(err){
            // if the above returned an error, it is likely due to missing metadata 
            query.execute().then(success).fail(queryFailed);
        }
    };
    
    this.getFrom = function (args) {
        var success = _.bind(this.querySucceeded, args);
        var source = (_.isObject(args)) ? args.source : args;
        var limit = (args && args.limit) ? args.limit : 10; 
        
        return breeze.EntityQuery
            .from(source)
            .take(10)
            .using(manager)
            .execute()
            .then(success)
            .fail(queryFailed);

    };


    this.saveChanges = function () {
        var msg = manager.hasChanges() ? "changes saved" : "nothing to save";
        return manager.saveChanges()
            .then(function() { console.log(msg); })
            .fail(saveFailed);
    };
    
    this.queryFailed = function (error) {
        console.log("Query failed: " + error.message);
    }

    this.loadOptionsFailed = function(error) {
        console.log("Load of options failed: " + error.message);
    }

    this.saveFailed = function(error) {
        console.log("Save failed: " + error.message);
    }
    
}

return DataService;

});