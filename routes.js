var mongodb = require('mongodb');
var fs = require('fs');
var breezeMongo = require('breeze-mongodb');
var mailer = require('./models/mailer');
var metadata;

var host = 'localhost';
var port = 27017;
var dbName = 'bidclinic';
var serverBase = 'public';
var dbServer = new mongodb.Server(host, port, { auto_reconnect: true});
var db = new mongodb.Db(dbName, dbServer, {
    strict:true,
    w: 1,
    safe: true
});
db.open(function () {/* noop */ });

var CronJob = require('cron').CronJob;
new CronJob('00 49 14 * * *', function(){
    var query = {
        $and: [
        { Expiration: { $lte : new Date()} },
        { CaseStatus: { $ne : 'Closed' } }
        ]
    };

    var collection = db.collection('Cases');
    var cursor = collection.find(query);
    cursor.each(function(err, item){
        if(item){
            /*
            var mailOptions = {
                to: item.PatientEmail, // list of receivers
                subject: 'Case Expired...', // Subject line
                text: 'Your case has expired: "' + item.Description + '"'
            };
            mailer.send(mailOptions);
            */
        }
    })
    collection.update(query,
        {
            $set : {
                CaseStatus: "Closed"
            }
        },
        {
            multi: true,
            raw: true
        },
        function(err,count, status){
            if(err) console.log(err); 
            else {
                console.log(status);
            }
        });
}, null, true, "America/Los_Angeles");

exports.getMetadata = function(req, res, next) {
    if (!metadata){ getMetadataFromScriptFile();  }
    res.send(metadata);

    function getMetadataFromScriptFile(){
        var filename = serverBase + "/app/metadata.js";
        if (!fs.existsSync(filename)) {
            next(new Error("Unable to locate metadata file: " + filename));
        }
        var metadataSrc = fs.readFileSync(filename, 'utf8');

        // Depend upon metadata.js in expected form:
        //   begins "var zza=zza||{};zza.metadata=" ...then \n ... then { ... and
        //   ends with "};"
        metadata = metadataSrc.substring(
            metadataSrc.indexOf('\n{')-1, // start with '{' following a newline
            metadataSrc.lastIndexOf('}')+1); // end with last '}'
    }
}

exports.test = function(req, res, next){
    
};

exports.get = function (req, res, next) {
    var slug = req.params.slug;
    var slugLc = slug.toLowerCase(); // we only use lower case for named queries
    if (namedQuery[slugLc]) {
        namedQuery[slugLc](req, res, next);
    } else {
        var err = {statusCode: 404, message: "Unable to locate query for " + slug};
        next(err) ;
        return;
    }
};

exports.getExampleResource = function(req, res, next) {
    var query = new breezeMongo.MongoQuery(req.query);
    // add your own filters here
    // Case of collection name matters, e.g. "Product", not "product"
    query.execute(db, "ExampleResource", processResults(res, next));
};

exports.getPatients = function(req, res, next) {
    var query = new breezeMongo.MongoQuery(req.query);
    // add your own filters here
    // Case of collection name matters, e.g. "Product", not "product"
    query.execute(db, "Patients", processResults(res, next));
};

exports.getBids = function(req, res, next) {
    var query = new breezeMongo.MongoQuery(req.query);
    // add your own filters here
    // Case of collection name matters, e.g. "Product", not "product"
    query.execute(db, "Bids", processResults(res, next));
};

exports.getDoctors = function(req, res, next) {
    var query = new breezeMongo.MongoQuery(req.query);
    // add your own filters here
    // Case of collection name matters, e.g. "Product", not "product"
    query.execute(db, "Doctors", processResults(res, next));
};

exports.getCases = function(req, res, next) {
    var query = new breezeMongo.MongoQuery(req.query);
    // add your own filters here
    // Case of collection name matters, e.g. "Product", not "product"
    query.execute(db, "Cases", processResults(res, next));
};

exports.getUsers = function(req, res, next) {
    var query = new breezeMongo.MongoQuery(req.query);
    // add your own filters here
    // Case of collection name matters, e.g. "Product", not "product"
    query.execute(db, "Users", processResults(res, next));
};


// if you don't want to use a Mongo query
function executeQuery(db, collectionName, query, fn) {
    var that = this;
    db.collection(collectionName, {strict: true} , function (err, collection) {
        if (err) {
            err = { statusCode: 404, message: "Unable to locate: " + collectionName, error: err };
            fn(err, null);
            return;
        }

        var src = collection.find(query.filter || {}, query.select || {}, query.options || {});
        src.toArray(function (err, results) {
            results == results || [];
            if (query.resultEntityType) {
                results.forEach(function(r) { r.$type = query.resultEntityType} )
            }
            fn(err, results || []);
        });

    });

};

/* Zzz sample app stuff */

/* Named queries */
var namedQuery = {
    // always all lower case!
    customers: makeVanillaCollectionQuery('Customer'),
    orders: makeVanillaCollectionQuery('Order'),
    orderstatuses: makeVanillaCollectionQuery('OrderStatus'),
    products: makeVanillaCollectionQuery('Product'),
    productoptions: makeVanillaCollectionQuery('ProductOption'),
    productsizes: makeVanillaCollectionQuery('ProductSize'),

    lookups: lookups
};

function makeVanillaCollectionQuery(collectionName) {
    return function(req, res, next) {
        var query = new breezeMongo.MongoQuery(req.query);
        query.execute(db,collectionName, processResults(res, next));
    } ;
}

function lookups(req, res, next) {
    var lookups = {};
    var queryCountDown = 0;
    var done = processResults(res, next);

    getAll('OrderStatus','OrderStatus');
    getAll('Product','Product');
    getAll('ProductOption','ProductOption');
    getAll('ProductSize','ProductSize');

    function getAll(collectionName, entityType) {
        db.collection(collectionName, {strict: true} , function (err, collection) {
            if (err) {
                err = { statusCode: 404, message: "Unable to locate: " + collectionName, error: err };
                done(err, null);
                return;
            }
            queryCountDown += 1;
            src = collection.find().toArray(function (err, results) {
                queryCountDown -= 1;
                if (err) {
                    done(err,null);
                    return;
                }
                //Todo: explain why we add $type
                results.forEach(function(r) {r.$type = entityType});
                lookups[collectionName]=results;

                if (queryCountDown === 0) {
                    done(null, lookups);
                }
            });
        });
    }

};


function processResults(res, next) {

    return function(err, results) {
        if (err) {
            next(err);
        } else {
            // Prevent browser from caching results of API data requests
            // Todo: Is this always the right policy? Never right? Or only for certain resources?
            res.setHeader('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
            res.setHeader("Content-Type:", "application/json");
            res.send(results);
        }
    }
}

function getModifiedProperties (entity){
    var ret = { 
        state : entity.entityAspect.entityState, 
        props : entity.entityAspect.originalValuesMap
    };

    return ret;
    //if(ret.state == 'Added') return ret;

    //if(ret.state == 'Modified') return ret;

}

function checkCases(req){
    if(req.body && req.body.entities){
        for(var i = 0, ii = req.body.entities.length; i < ii; i++){
            if(req.body.entities[i].entityAspect.entityTypeName == 'Case:#dm'){
                var diff = getModifiedProperties(req.body.entities[i]);

                if(diff.state == 'Modified' && req.body.entities[i].CaseStatus == 'Closed' && diff.props.CaseStatus == 'Open'){
                    // Case was just closed
                    var mailOptionsPractice = {
                        to: req.body.entities[i].WinnerEmail, // list of receivers
                        subject: 'Your bid has been accepted!', // Subject line
                        text: 'A patient has accepted your bid for $' + req.body.entities[i].WinningBid + '.'  // plaintext body
                    };

                    var mailOptionsPatient = {
                        to: req.body.entities[i].PatientEmail, // list of receivers
                        subject: 'Bid Accepted, Case closed!', // Subject line
                        text: 'Your confirmatio number for your case is: '  + req.body.entities[i]._id// plaintext body
                    };

                    mailer.send(mailOptionsPractice);
                    mailer.send(mailOptionsPatient);


                } else if(diff.state == 'Modified' && (diff.props.Bids && diff.props.Bids.length > 0)){
                    var mailOptions = {
                        to: req.body.entities[i].PatientEmail, // list of receivers
                        subject: 'New Incoming Bid!', // Subject line
                        text: 'Someone has bid on one of your cases.  Login now to see more.' // plaintext body
                    };

                    mailer.send(mailOptions);
                } else if (diff.state == 'Added'){
                    var mailOptions = {
                        to: req.body.entities[i].PatientEmail, // list of receivers
                        subject: 'New Case Created!', // Subject line
                        text: 'Your case has been created.  Login to view bids!' // plaintext body
                    };

                    mailer.send(mailOptions);
                }
            }
        }

    }
}

/*** Save Changes ***/

exports.saveChanges = function(req, res, next) {
    var saveHandler = new breezeMongo.MongoSaveHandler(db, req.body, processResults(res, next));
    saveHandler.beforeSaveEntity = beforeSaveEntity;
    saveHandler.beforeSaveEntities = beforeSaveEntities;
    checkCases(req);
    saveHandler.save();
};

function beforeSaveEntity(entity) {
    /* logic here */
    return true;
}

function beforeSaveEntities(callback) {
    /* logic here */
    callback();
}


