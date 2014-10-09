var mongoose = require('mongoose'),
	User = require('./models/user'),
    nodemailer = require('nodemailer');

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'ben.g.hron@gmail.com',
        pass: 'hron41380'
    }
});

mongoose.connect('mongodb://localhost/bidclinic');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));


exports.updatePassword = function(req, res, next){

    if(!req.query.password || !req.query.username) res.send(response);

    // TODO check if account currently exists first
    var newPassword = req.query.update;

    var newUser = new User({
        username: req.query.username,
        password: req.query.password
    });

    auth(req.query.username, req.query.password, res, response, function(authenticated, reasons){
        if(authenticated){
            newUser.save(function(err) {
                if (err) throw err;

                var mailOptions = {
                    from: 'bidclinic<info@bidclinic.com>', // sender address
                    to: req.query.username, // list of receivers
                    subject: 'Password Updated', // Subject line
                    text: 'Your password has been updated.' // plaintext body
                };

                // send mail with defined transport object
                transporter.sendMail(mailOptions, function(error, info){
                    if(error){
                        console.log(error);
                    }else{
                        console.log('Message sent: ' + info.response);
                    }
                });
            });

        } else {
            // Not saved

        }
    });
}

exports.resetPassword = function(req, res, next){

}

exports.createUser = function(req, res, next){
    var response = {
        authenticated: false
    };

    if(!req.query.Email) res.send(response);

    // TODO check if account currently exists first
    // TODO generate password
    var password = 'Aa123456';

    var newUser = new User({
        username: req.query.Email,
        //password: req.query.password
        password: password
    });


    newUser.save(function(err) {
        if (err) throw err;
        auth(req.query.Email, password, res, response, function(){

            var mailOptions = {
                from: 'bidclinic<info@bidclinic.com>', // sender address
                to: req.query.Email, // list of receivers
                //to: 'bghron@gmail.com',
                subject: 'Account Created', // Subject line
                text: 'Welcome to BidClinic!  Your account has been created.  Your new password is' + password // plaintext body
            };

            // send mail with defined transport object
            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    console.log(error);
                }else{
                    console.log('Message sent: ' + info.response);
                }
            });

            response.authenticated = true;
            res.send(response);

        });
    });
}

exports.authenticate = function(req, res, next){
    var response = { authenticated: false };
    if(!req.query.password || !req.query.username) res.send(response);
    auth(req.query.username, req.query.password, res, response);
}

function auth(username, password, res, response, callback){
    User.getAuthenticated(username, password, function(err, user, reason) {
        if (err) throw err;

        // login was successful if we have a user
        if (user) {
            // handle login success
            if (callback) callback(true);
            else if (res && response){
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
                response.locked = true;
                // send email or otherwise notify user that account is
                // temporarily locked
                break;
        }

        if(callback) callback(false, reasons);
        else if(res && response) res.send(response);
    }); 
}