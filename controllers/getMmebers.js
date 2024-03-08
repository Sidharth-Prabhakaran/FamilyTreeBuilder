async function getMembersFunc(tree_name){
    var neo4j = require('neo4j-driver');
  var driver = neo4j.driver('bolt://localhost:7687')
  const query = 'match (n:Person {familyName:$tree_name}) return n';
  const session = driver.session();
  console.log('Getting people');
  try {
    const result = await session.run(query, { tree_name });
    const people = result.records.map(record => record.get('n').properties);
    return people;
  } catch (error) {
    console.error(error);
    // res.status(500).send('Error retrieving people');
  } finally {
    // console.log(people);
    session.close();    
  }
}

    module.exports = getMembersFunc;