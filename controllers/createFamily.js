var neo4j = require('neo4j-driver');
var driver = neo4j.driver('bolt://neo4j:7687')

async function createFamPostFunc(req, res) {
    const name = req.body.name;
    const dob = req.body.dob;
    const familyName = req.session.familyName;
  
    console.log(name + " " + dob + " " + familyName);
    const session = driver.session();
    const query = 'CREATE (p:Person {name: $name, dob: $dob, familyName: $familyName})';
    const params = { name, dob, familyName };
  
    session
      .run(query, params)
      .then(() => {
        session.close();
        console.log('Node created');
        res.redirect('/createfamily/'+familyName);
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('Error creating node');
      });
    }

module.exports = createFamPostFunc;