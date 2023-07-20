var mysql = require('mysql');
var connection2 = mysql.createConnection({
  host: process.env.RDS_HOSTNAME,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DB_NAME
});

const bcrypt = require('bcrypt');

async function registerPostFunc(req, res) {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Check if user already exists with the email
    connection2.query(
      'SELECT * FROM users WHERE email = ?',
      [req.body.email],
      function (error, userResults, fields) {
        if (error) {
          throw error;
        }

        if (userResults.length > 0) {
          // User already exists with the email
          res.render('register', { errorMessage: 'User already exists with the given email' });
        } else {
          // Insert user data into the 'users' table
          connection2.query(
            'INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)',
            [req.body.firstName, req.body.lastName, req.body.email, hashedPassword],
            function (error, userResults, fields) {
              if (error) {
                throw error;
              }

              const userId = userResults.insertId; 
              connection2.query(
                'SELECT * FROM Invited_Users WHERE email = ?',
                [req.body.email],
                function (error, inviteResults, fields) {
                  if (error) {
                    throw error;
                  }

                  const treePromises = inviteResults.map((invite) => {
                    return new Promise((resolve, reject) => {
                      connection2.query(
                        'INSERT INTO user_trees (user_id, tree_name, access_level) VALUES (?, ?, ?)',
                        [userId, invite.tree_name, 'view'],
                        function (error, treeResults, fields) {
                          if (error) {
                            reject(error);
                          } else {
                            resolve();
                          }
                        }
                      );
                    });
                  });

                  Promise.all(treePromises)
                    .then(() => {
                      // Remove inserted records from 'Invited_Users' table
                      connection2.query(
                        'DELETE FROM Invited_Users WHERE email = ?',
                        [req.body.email],
                        function (error, deleteResults, fields) {
                          if (error) {
                            throw error;
                          }
                          
                          res.render('register', { successMessage: 'Registration successful. You can now log in.' });
                        }
                      );
                    })
                    .catch((error) => {
                      console.log(error);
                      res.render('register', { errorMessage: 'Failed to insert tree records. Please try again.' });
                    });
                }
              );
            }
          );
        }
      }
    );
  } catch (error) {
    console.log(error);
    res.render('register', { errorMessage: 'An error occurred. Please try again.' });
  }
}

module.exports = registerPostFunc;
