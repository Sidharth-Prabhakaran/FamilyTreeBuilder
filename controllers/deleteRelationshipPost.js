var neo4j = require('neo4j-driver');
var driver = neo4j.driver('bolt://neo4j:7687')

async function deleteRelationshipPostFunc(req, res) {

    var person = req.body.person;
    var relatedperson = req.body.relatedperson;
    var familyName = req.params.tree_name;


    var relExists = false;
    // console.log("in the create relationship post function");
    const session1 = driver.session();
    var relQuery = "MATCH (:Person {name:$person ,familyName:$familyName})<-[r]->(n:Person {name :$relatedperson,familyName:$familyName}) RETURN count(*) > 0 as relExists";
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
  
      if(!relExists){
        errMessage = 'Relationship Does not exist between ' + person + ' and ' + relatedperson ;
        res.render('deleteRelationship.ejs', { tree_name:req.params.tree_name,people : req.session.people, errorMessage: errMessage});
        // console.log('Relationship Does not exist');
        
      }else{
         
        const session = driver.session();
        // delete relationship between person and relatedperson
        const query = 'MATCH (:Person {name:$person ,familyName:$familyName})<-[r]->(n:Person {name :$relatedperson,familyName:$familyName}) DELETE r';
        const params = { person, relatedperson,familyName };
  
        try{
          await session.run(query, params)
          .then(() => {
            session.close();
            console.log('Relationship Deleted');
            successMsg = 'Relationship Deleted between ' + person + ' and ' + relatedperson ;
            res.render('deleteRelationship.ejs', { tree_name:req.params.tree_name,people : req.session.people, successMessage: successMsg  });
          })
          .catch(error => {
            console.error(error);
            res.status(500).send('Error Deleting relationship');
          });
        }catch(error){
  
        }
        finally{
          session.close();
        }
      }
    }

    

    module.exports = deleteRelationshipPostFunc;
    