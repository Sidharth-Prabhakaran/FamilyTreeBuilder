var mysql = require('mysql');
var connection2 = mysql.createConnection({
    host     : process.env.RDS_HOSTNAME,
    user     : process.env.RDS_USERNAME,
    password : process.env.RDS_PASSWORD,
  //   port     : process.env.RDS_PORT,
    database : process.env.RDS_DB_NAME
  });
const bcrypt = require('bcrypt');

async function registerPostFunc(req, res) {
    try{
      
      
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        // saves from sql injection
        
           connection2.query('INSERT INTO users (first_name,last_name, email, password) VALUES (?,?,?,?)', ["defaultname", req.body.username, req.body.email, hashedPassword], async function (error, results, fields) {
            if (error) throw error;
          
            res.redirect('/login');
          });
        
        
        
    }catch{
      
        res.redirect('/register');
    }
    // console.log(users);
    }


    // Usage example:
    

module.exports = registerPostFunc;
