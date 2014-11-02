var nodemailer = require('nodemailer'),
	_ = require('underscore');

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'ben.g.hron@gmail.com',
        pass: 'hron41380'
    }
});

var mailOptions = {
    from: 'bidclinic<info@bidclinic.com>', // sender address
};

exports.api = function(req, res, next){
    var test;

}


exports.send = function(options){
	transporter.sendMail(_.extend(mailOptions, options), function(error, info){
        if(error){
            console.log(error);
        }else{
            console.log('Message sent: ' + info.response);
        }
    });
}
