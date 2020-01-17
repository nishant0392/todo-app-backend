/******* =================  NodeMailer  ================= *******/

"use strict";
const nodemailer = require("nodemailer");

// async..await is not allowed in global scope, must use a wrapper
async function SendMail(receiver) {

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "testmail.nishant@gmail.com",  
      pass:  "nick0392" 
    }
  });

  let mailOptions = {
    from: '"Nishant Kumar 👻" <nishant@nishant-kumar.com>', // sender address
    to: receiver.emailAddress,    // list of receivers
    subject: receiver.subject,   // Subject line
    text: receiver.text,        // plain text body
    html: receiver.html        // html body
  };

  // Send mail using the default smtp transport
  let thenPromise = await transporter.sendMail(mailOptions);

  return thenPromise;
}

/******* =================  NodeMailer  ================= *******/

module.exports = {
  SendMail: SendMail
}
