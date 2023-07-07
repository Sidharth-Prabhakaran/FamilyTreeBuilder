
var mysql = require('mysql');
  var connection = mysql.createConnection({
    host     : process.env.RDS_HOSTNAME,
    user     : process.env.RDS_USERNAME,
    password : process.env.RDS_PASSWORD,
  //   port     : process.env.RDS_PORT,
    database : process.env.RDS_DB_NAME
  });
   function getUsersFunc() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users'; // Replace with your actual query
  
      connection.query(query,  (error, results, fields) => {
        if (error) {
          console.error('Error executing query:', error);
          reject(error);
          return;
        }
  
        const users = results.map(row => ({
          id: row.id,
          email: row.email,
          name: row.first_name + ' ' + row.last_name,
          password: row.password
        }));
        // console.log(users);
  
        resolve(users);
      });
    });
  }
  
exports.getUsersFunc = getUsersFunc;