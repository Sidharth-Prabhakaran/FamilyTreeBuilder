var mysql = require('mysql');
var connection = mysql.createConnection({
    host     : process.env.RDS_HOSTNAME,
    user     : process.env.RDS_USERNAME,
    password : process.env.RDS_PASSWORD,
  //   port     : process.env.RDS_PORT,
    database : process.env.RDS_DB_NAME
  });
var neo4j = require('neo4j-driver');
var driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'Mother@123'));
async function createTreePostFunc(req, res) {
    const { treeName } = req.body;
    
    connection.query('SELECT COUNT(*) AS count FROM user_trees WHERE tree_name = ?', [treeName], (error, results) => {
      if (error) {
        console.error('Error checking tree name uniqueness:', error);
        res.render('createTree', { errorMessage: 'An error occurred. Please try again.' });
      } else {
        const count = results[0].count;
  
        if (count > 0) {
          res.render('createTree', { errorMessage: 'The tree name is already taken. Please enter a unique name.' });
        } else {
          // Insert the tree name into the user-tree database
          connection.query('INSERT INTO user_trees (user_id, tree_name, access_level) VALUES (?, ?, ?)', [req.user.id, treeName, 'edit'], async (error) => {
            if (error) {
              console.error('Error inserting tree name:', error);
              res.render('createTree', { errorMessage: 'An error occurred. Please try again.' });
            } else {
              
              const ses = driver.session();
              try {
                 await ses.run('CREATE (n:Tree {name: $treeName})', { treeName });
                 req.session.familyName = treeName;
                 
                res.redirect('/createfamily');
              } catch (error) {
                console.error('Error creating starting node in Neo4j:', error);
                res.render('createTree', { errorMessage: 'An error occurred. Please try again.' });
              } finally {
                 await ses.close();
              }
            }
          });
        }
      }
    });
  }

module.exports = createTreePostFunc;