const { sendEmail } = require("./mailer");
const mysql = require('mysql');

const connection = mysql.createConnection({
  host: process.env.RDS_HOSTNAME,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DB_NAME
});

async function inviteMembersPostFunc(req, res) {
  var subject = 'Invitation from ' + req.user.name + ' to join ' + req.params.tree_name + ' Tree';

  connection.query('SELECT * FROM users WHERE email = ?', [req.body.email], async function (error, userResults, fields) {
    if (error) {
      throw error;
    }

    if (userResults.length > 0) {
      // User already exists, check if they have access to the tree
      connection.query('SELECT * FROM user_trees WHERE user_id = ? AND tree_name = ?', [userResults[0].id, req.params.tree_name], async function (error, treeResults, fields) {
        if (error) {
          throw error;
        }

        if (treeResults.length > 0) {
          // User already has access to the tree
          res.render('invite.ejs', { tree_name: req.params.tree_name, errorMessage: 'User already has access to this tree' });
        } else {
          // User does not have access, send invitation email
          var text = 'Hello ' + userResults[0].first_name + ' ' + userResults[0].last_name + ',\nYou are invited to join ' + req.params.tree_name + ' Tree by ' + req.user.name + '. Please click on the link below to view the tree. \n\n' +
            'http://localhost:3000/login \n\n' + 'Thanks, \n' + 'FamilyTreeBuilder Team';

          try {
            await sendEmail(req.body.email, subject, text);

            connection.query('INSERT INTO user_trees (user_id, tree_name, access_level) VALUES (?, ?, ?)', [userResults[0].id, req.params.tree_name, 'view'], function (error, treeResults, fields) {
              if (error) {
                throw error;
              }

              res.render('invite.ejs', { tree_name: req.params.tree_name, successMessage: 'User added to ' + req.params.tree_name + ' successfully' });
            });
          } catch (error) {
            console.log(error);
            res.render('invite.ejs', { tree_name: req.params.tree_name, errorMessage: 'Failed to send email to ' + req.body.email + ', please try again' });
          }
        }
      });
    } else {
      // User does not exist, check if the email is already invited
      connection.query('SELECT * FROM Invited_Users WHERE email = ? AND tree_name = ?', [req.body.email, req.params.tree_name], async function (error, invitedResults, fields) {
        if (error) {
          throw error;
        }

        if (invitedResults.length > 0) {
          // Email is already invited
          res.render('invite.ejs', { tree_name: req.params.tree_name, errorMessage:  req.body.email + ' has already been invited to this tree' });
        } else {
          // User does not exist and email is not invited, send an email invitation
          var text = 'Hello ' + req.body.email + ',\nYou are invited to join ' + req.params.tree_name +
            ' Tree by ' + req.user.name + '. Please click on the link below to create an account at FamilyTreeBuilder and view the tree. \n\n' +
            'http://localhost:3000/register \n\n' + 'Thanks, \n' + 'FamilyTreeBuilder Team';

          try {
            await sendEmail(req.body.email, subject, text);

            connection.query('INSERT INTO Invited_Users (email, tree_name) VALUES (?, ?)', [req.body.email, req.params.tree_name], function (error, results, fields) {
              if (error) {
                throw error;
              }

              res.render('invite.ejs', { tree_name: req.params.tree_name, successMessage: 'Invite sent to ' + req.body.email + ' successfully' });
            });
          } catch (error) {
            console.log(error);
            res.render('invite.ejs', { tree_name: req.params.tree_name, errorMessage: 'Failed to send email to ' + req.body.email + ', please try again' });
          }
        }
      });
    }
  });
}

module.exports = inviteMembersPostFunc;
