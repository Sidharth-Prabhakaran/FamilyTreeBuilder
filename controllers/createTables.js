var mysql = require('mysql');
var connection = mysql.createConnection({
    host     : process.env.RDS_HOSTNAME,
    user     : process.env.RDS_USERNAME,
    password : process.env.RDS_PASSWORD,
    port     : process.env.RDS_PORT,
    database : process.env.RDS_DB_NAME
  });

async function createTables(req, res) {

    connection.query('CREATE TABLE IF NOT EXISTS users (id INT PRIMARY KEY AUTO_INCREMENT,first_name VARCHAR(50) NOT NULL,last_name VARCHAR(50) NOT NULL,email VARCHAR(100) NOT NULL,password VARCHAR(100) NOT NULL)', (error) => {
        if (error) {
            console.error('Error creating users table:', error);
            res.render('createTree', { errorMessage: 'An error occurred. Please try again.' });
        } else {
            console.log('Created users table');
        }
    });

    connection.query('CREATE TABLE IF NOT EXISTS user_trees (id INT PRIMARY KEY AUTO_INCREMENT,user_id INT NOT NULL,tree_name VARCHAR(100) NOT NULL,access_level ENUM("view", "edit") NOT NULL,FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)', (error) => {
        if (error) {
            console.error('Error creating user_trees table:', error);
            res.render('createTree', { errorMessage: 'An error occurred. Please try again.' });
        } else {
            console.log('Created user_trees table');
        }
    });

    connection.query('CREATE TABLE IF NOT EXISTS Invited_Users(id INT PRIMARY KEY AUTO_INCREMENT,email VARCHAR(100) NOT NULL,tree_name VARCHAR(100) NOT NULL)', (error) => {   
        if (error) {
            console.error('Error creating invited_users table:', error);
            res.render('createTree', { errorMessage: 'An error occurred. Please try again.' });
        } else {
            console.log('Created invited_users table');
        }
    });

}

module.exports = createTables;