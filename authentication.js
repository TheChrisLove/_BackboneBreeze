var mongoose = require('mongoose'),
	User = require('./models/user');

mongoose.connect('mongodb://localhost/bidclinic');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

// create a user a new user
var testUser = new User({
    username: 'jmar777',
    password: 'Password123'
});

// save user to database
testUser.save(function(err) {
    if (err) throw err;

    /*
    // fetch user and test password verification
    User.findOne({ username: 'jmar777' }, function(err, user) {
        if (err) throw err;

        // test a matching password
        user.comparePassword('Password123', function(err, isMatch) {
            if (err) throw err;
            console.log('Password123:', isMatch); // -> Password123: true
        });

        // test a failing password
        user.comparePassword('123Password', function(err, isMatch) {
            if (err) throw err;
            console.log('123Password:', isMatch); // -> 123Password: false
        });
    });
	*/

   // attempt to authenticate user
    User.getAuthenticated('jmar777', 'Password123', function(err, user, reason) {
        if (err) throw err;

        // login was successful if we have a user
        if (user) {
            // handle login success
            console.log('login success');
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
    }); 
});

/*
// Fired once connection opens
db.once('open', function callback () {

	var kittySchema = mongoose.Schema({
	    name: String
	})


	kittySchema.methods.speak = function () {
	  var greeting = this.name
	    ? "Meow name is " + this.name
	    : "I don't have a name"
	  console.log(greeting);
	}

	var Kitten = mongoose.model('Kitten', kittySchema)

	var fluffy = new Kitten({ name: 'fluffy' });

	fluffy.save(function (err, fluffy) {
		if (err) return console.error(err);
		fluffy.speak();
	});

	Kitten.find({ name: /^fluff/ }, function (err, kittens) {
		if (err) return console.error(err);
		console.log(kittens)
	})

});
*/


