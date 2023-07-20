var neo4j = require('neo4j-driver');
var driver = neo4j.driver('bolt://neo4j:7687')

async function deleteRelationshipGetFunc(req, res) {
  const treeName = req.params.tree_name;
  console.log('treeName: ' + treeName);
  
    const query = 'match (n:Person {familyName:$treeName}) return n';
    const session = driver.session();
    console.log('Getting people');
    session.run(query,{treeName})
      .then(result => {
        const people = result.records.map(record => record.get('n').properties);
        req.session.people = people;
        
        res.render('deleteRelationship.ejs', { people, tree_name: treeName});
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('Error retrieving people');
      })
      .finally(() => session.close());
  }

  module.exports = deleteRelationshipGetFunc;