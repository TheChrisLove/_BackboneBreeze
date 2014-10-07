var mongoose = require('mongoose'),
	User = require('./models/user');

mongoose.connect('mongodb://localhost/bidclinic');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));


exports.createUser = function(req, res, next){
    var response = {
        authenticated: false
    };

    if(!req.query.password || !req.query.username) res.send(response);

    var newUser = new User({
        username: req.query.username,
        password: req.query.password
    });

    newUser.save(function(err) {
        if (err) throw err;
        auth(req.query.username, req.query.password, res, response);
    });
}

exports.authenticate = function(req, res, next){
    var response = {
        authenticated: false
    };

    if(!req.query.password || !req.query.username) res.send(response);

    
    auth(req.query.username, req.query.password, res, response);

}

function auth(username, password, res, response){
    User.getAuthenticated(username, password, function(err, user, reason) {
        if (err) throw err;

        // login was successful if we have a user
        if (user) {
            // handle login success
            if (res && response){
                response.authenticated = true;
                res.send(response);
            }
            return;
        }

        // otherwise we can determine why we failed
        var reasons = User.failedLogin;
        switch (reason) {
            case reasons.NOT_FOUND:
            case reasons.PASSWORD_INCORRECT:
                // note: these cases are usually treated the same - don't tell
                // the user *why* the login failed, only that it did
                break;
            case reasons.MAX_ATTEMPTS:
                // send email or otherwise notify user that account is
                // temporarily locked
                break;
        }

        if(res && response) res.send(response);
    }); 
}