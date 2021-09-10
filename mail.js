const nodemailer = require('nodemailer')

var transporter = nodemailer.createTransport({
    host: "smtp.na.jnj.com",
    port: 25,
    secure: false, // use TLS
    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: false
    }
});

transporter.verify(function(error, success) {
    if (error) {
      console.log(error);
    } else {
      console.log("Server is ready to take our messages");
    }
});
