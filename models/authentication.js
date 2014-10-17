var mongoose = require('mongoose'),
	Passport = require('./passport'),
    nodemailer = require('nodemailer'),
    mailer = require('./mailer'),
    generatePassword = require('password-generator');

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


// TODO
exports.updatePassword = function(req, res, next){
    var response = { authenticated: false };
    if(!req.query.password || !req.query.username) res.send(response);

    auth(req.query.username, req.query.password, function(user, reason){
        if(user){

            // TODO update user with new password then save
            /*
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
            */

        } else {
            res.send({ err: 'User Not Found'});
        }
    });
}

// TODO
exports.resetPassword = function(req, res, next){

}

exports.createPassport = function(req, res, next){
    var response = {
        authenticated: false
    };

    if(!req.query.Email) res.send(response);

    Passport.findOne({ username: req.query.Email }, function(err, passport){
        
        if (passport){
            return res.send({
                error: 'User Exists',
                authenticated: false
            });
        }

        var password = (req.query.Password) ? req.query.Password : generatePassword();
        var newPassport = new Passport({
            username: req.query.Email,
            password: password
        });

        newPassport.save(function(err) {
            if (err) throw err;
            auth(req.query.Email, password, function(passport, reason){
                if(passport){
                    var mailOptions = {
                        from: 'bidclinic<info@bidclinic.com>', // sender address
                        to: req.query.Email, // list of receivers
                        //to: 'bghron@gmail.com',
                        subject: 'Account Created', // Subject line
                        text: 'Welcome to BidClinic!  Your account has been created.  Your new password is ' + password // plaintext body
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
                } else if (reason){
                    response[reason] = true;
                    res.send(response);
                } else res.send(response);
            });
        });
    });
}

exports.authenticate = function(req, res, next){
    var response = { authenticated: false };
    if(!req.query.password || !req.query.username) res.send(response);
    auth(req.query.username, req.query.password, function(passport, reason){
        if(passport) res.send({authenticated: true})
        else if (reason){
            response[reason] = true;
            res.send(response);
        } else res.send(response);
    });
}

function auth(username, password, cb){
    Passport.getAuthenticated(username, password, function(err, passport, reason) {
        if (err) throw err;

        // login was successful if we have a user
        if (passport && cb) return cb(passport);

        // otherwise we can determine why we failed
        var reasons = Passport.failedLogin;
        switch (reason) {
            case reasons.NOT_FOUND:
            case reasons.PASSWORD_INCORRECT:
                // note: these cases are usually treated the same - don't tell
                // the user *why* the login failed, only that it did
                if (cb) return cb(false, 'invalid');
                break;
            case reasons.MAX_ATTEMPTS:
                if (cb) return cb(false, 'locked');
                // send email or otherwise notify user that account is
                // temporarily locked
                break;
        }
    }); 
}