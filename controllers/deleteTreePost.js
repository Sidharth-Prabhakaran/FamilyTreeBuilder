var mysql = require('mysql');
var connection = mysql.createConnection({
    host     : process.env.RDS_HOSTNAME,
    user     : process.env.RDS_USERNAME,
    password : process.env.RDS_PASSWORD,
  //   port     : process.env.RDS_PORT,
    database : process.env.RDS_DB_NAME
  });
var neo4j = require('neo4j-driver');
var driver = neo4j.driver('bolt://neo4j:7687')


async function deleteTreePostFunc(req, res) {
    var tree_name = req.params.tree_name;
    console.log(tree_name);
connection.query('DELETE FROM user_trees WHERE tree_name = ?', [tree_name], function (error, results, fields) {
    if (error) throw error;
    
    driver.session().run(
        'MATCH (n:Person {familyName: $tree_name}) DETACH DELETE n',
        {tree_name: tree_name}
    ).then(() => {
        res.redirect('/profile');
    }
    ).catch((error) => {
        console.log(error);
    }
    );
  }
    );
}

module.exports = deleteTreePostFunc;