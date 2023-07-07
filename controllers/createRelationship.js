var neo4j = require('neo4j-driver');
var driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', process.env.NEO4J_PASSWORD));

async function createRelationshipFunc(req, res) {

    var person = req.body.person;
    var relatedperson = req.body.relatedperson;
    var relationship = req.body.relationship; 
    var familyName = req.params.tree_name;
    if(relatedperson === person){
      res.render('createRelationship.ejs', {tree_name:req.params.tree_name, people : req.session.people, errorMessage: 'Cannot create relationship with self'});
      console.log('Cannot create relationship with self');
      return;
    }

    var relExists = false;
    // console.log("in the create relationship post function");
    const session1 = driver.session();
    var relQuery = "MATCH (:Person {name:$person, familyName:$familyName})<-[r]->(n:Person {name :$relatedperson, familyName:$familyName}) RETURN count(*) > 0 as relExists";
    var parameters = {person, relatedperson,familyName};
    try{
      await session1.run(relQuery, parameters)
      .then(result => {
        relExists = result.records[0].get('relExists');
        console.log(relExists);
      })
    }catch(error){
      console.error(error);
      res.status(500).send('Error retrieving people');
    }
    finally{
      // console.log("in the finally block of create relationship post function");
      session1.close();
    }
  
      if(relExists){
        var errMessage = 'Relationship already exists between ' + person + ' and ' + relatedperson ;
        res.render('createRelationship.ejs', { tree_name:req.params.tree_name,people : req.session.people, errorMessage: errMessage});
        console.log('Relationship already exists');
      }else{
        console.log('Creating Relationship');
        const session = driver.session();
        const query = 'MATCH (a:Person),(b:Person) WHERE a.name = $person AND b.name = $relatedperson CREATE (a)-[r:' +relationship  +']->(b)';
        const params = { person, relatedperson,relationship };
  
        try{
          await session.run(query, params)
          .then(() => {
            session.close();
            console.log('Relationship created');
            var successMsg = person + ' (' + relationship + ') \u2192 ' + relatedperson + ' has been created ' ;
            res.render('createRelationship.ejs', { tree_name:req.params.tree_name,people : req.session.people, successMessage: successMsg  });
          })
          .catch(error => {
            console.error(error);
            res.status(500).send('Error creating relationship');
          });
        }catch(error){
  
        }
        finally{
          session.close();
        }
      }
    }

    

    module.exports = createRelationshipFunc;
    