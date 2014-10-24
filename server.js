var fs = require("fs");
var express = require('express');
var routes = require('./routes');
var auth = require('./models/authentication');

require('jaydata');
require('q');
require('./models/product');

window.DOMParser=require('xmldom').DOMParser;

var CronJob = require('cron').CronJob;
// TODO implement cron to check expired dates on cases and close as necessary
/*
new CronJob('* * * * * *', function(){
    console.log('You will see this message every second');
}, null, true, "America/Los_Angeles");
*/

var app = express();
var appDir =  __dirname+'/../zza';
var expressAppdir =  __dirname+'/public';

app.configure(function(){
    app.use(express.query());
    app.use(express.cookieParser());
    app.use(express.methodOverride());  // for full REST ... if we need it
    app.use(express.session({secret: 'session key'}));
    app.use(express.bodyParser());

    app.use("/api", $data.JayService.OData.Utils.simpleBodyReader());
    app.use("/api", $data.JayService.createAdapter(api.Context, function (req, res) {
        return new api.Context({name: "mongoDB", databaseName:"bidclinic", address: "localhost", port: 27017 });
    }));

    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.compress());
    app.use('/', express.static(expressAppdir)); // look for overrides on express server 1st
    app.use('/', express.static(appDir));        // then look in regular zza
    app.use(app.router);
});

// only in development
app.configure('development', function(){
    app.use(logErrors);
});

app.configure(function(){
    //app.use(express.errorHandler()); // use our error handler instead of Express module
    app.use(errorHandler);
});

    /* '/breeze/zza' API routes */
app.configure(function() {
    app.get('/auth/update', auth.updatePassword);
    app.get('/auth/verify', auth.authenticate);
    app.get('/auth/create', auth.createPassport);
    app.get('/auth/resetRequest', auth.resetRequest);
    app.get('/auth/resetConfirm', auth.resetConfirm);
    app.get('/breeze/zza/Metadata', routes.getMetadata);
    app.post('/breeze/zza/SaveChanges', routes.saveChanges);
    app.get('/breeze/zza/Patients', routes.getPatients); 
    app.get('/breeze/zza/Bids', routes.getBids); 
    app.get('/breeze/zza/Cases', routes.getCases); 
    app.get('/breeze/zza/Doctors', routes.getDoctors); 
    app.get('/breeze/zza/Users', routes.getUsers); 
    app.get('/breeze/zza/:slug', routes.get); // must be last API route
});

app.listen(3000);
console.log('__dirname = ' + __dirname +
            '\nexpressAppdir = ' + expressAppdir +
            '\nappDir = ' + appDir);

console.log('\nListening on port 3000');

/* Our fall through error logger and errorHandler  */

function logErrors(err, req, res, next) {
    var status = err.statusCode || 500;
    console.error(status + ' ' + (err.message ? err.message : err));
    if(err.stack) { console.error(err.stack); }
    next(err);
}

function errorHandler(err, req, res, next) {
    var status = err.statusCode || 500;
    if (err.message) {
        res.send(status, err.message);
    } else {
        res.send(status, err);
    }
}


