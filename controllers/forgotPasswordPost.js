var mysql = require('mysql');
var connection2 = mysql.createConnection({
  host: process.env.RDS_HOSTNAME,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DB_NAME
});

const bcrypt = require('bcrypt');
const generateRandomPassword = require('./passwordGenerator');
const { sendEmail } = require('./mailer');

async function forgotPasswordPostFunc(req, res) {
  const email = req.body.email;

  // Check if the email exists in the users table
  connection2.query('SELECT * FROM users WHERE email = ?', [email], async function (error, results, fields) {
    if (error) {
      throw error;
    }

    if (results.length > 0) {
      // Email exists in the users table
      const newPassword = generateRandomPassword(8); // Generate a random password

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the password in the users table
      connection2.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], async function (error, updateResults, fields) {
        if (error) {
          throw error;
        }

        // Send the password reset email
        var subject = 'Password Reset';
        var text = 'Your new password is: ' + newPassword;
        try {
          await sendEmail(email, subject, text);
          res.render('forgotPassword', { successMessage: 'Password reset email sent' });
        } catch (error) {
          console.log(error);
          res.render('forgotPassword', { errorMessage: 'Failed to send password reset email' });
        }
      });
    } else {
      // Email does not exist in the users table
      res.render('forgotPassword', { errorMessage: 'Email does not exist' });
    }
  });
}

module.exports = forgotPasswordPostFunc;
