var neo4j = require('neo4j-driver');
var driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', process.env.NEO4J_PASSWORD));

async function createRelationshipFunc(req, res) {

    var person = req.body.person;
    var relatedperson = req.body.relatedperson;
    var relationship = req.body.relationship; 
    var relExists = false;
    console.log("in the create relationship post function");
    const session1 = driver.session();
    var relQuery = "MATCH (:Person {name:$person})<-[r]->(n:Person {name :$relatedperson}) RETURN count(*) > 0 as relExists";
    var parameters = {person, relatedperson};
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
      console.log("in the finally block of create relationship post function");
      session1.close();
    }
  
      if(relExists){
        res.render('createRelationship.ejs', { people : req.session.people, errorMessage: 'Relationship already exists'});
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
            res.render('createRelationship.ejs', { people : req.session.people, errorMessage: 'Relationship Has Been Created'  });
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
    