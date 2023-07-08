const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_ID,
        pass: process.env.GMAIL_PASSWORD
    }
});

async function sendEmail(email, subject, text) {
    return new Promise((resolve, reject) => {
      let mailOptions = {
        from: process.env.GMAIL_ID,
        to: email,
        subject: subject,
        text: text
      };
  
      transporter.sendMail(mailOptions, function (err, data) {
        if (err) {
          console.log('Error Occurs', err);
          reject('Failed to send email');
        } else {
          console.log('Email sent!!!');
          resolve('Email sent successfully');
        }
      });
    });
  }
  

module.exports = {sendEmail}