if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
    }

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride= require('method-override');
var neo4j = require('neo4j-driver');
let users = [];

const initializePassport = require('./passport-config');
initializePassport(passport, email => users.find(user => user.email === email), id => users.find(user => user.id === id));



var driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'Mother@123'));


var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : process.env.RDS_HOSTNAME,
  user     : process.env.RDS_USERNAME,
  password : process.env.RDS_PASSWORD,
//   port     : process.env.RDS_PORT,
  database : process.env.RDS_DB_NAME
});

connection.connect((err) => {
    if (err) {
      console.error('Error connecting to the database:', err);
      return;
    }
    console.log('Connected to the database!');
    
  });

  const query = 'SELECT * FROM users';

  connection.query(query, (error, results, fields) => {
    if (error) {
      console.error('Error executing query:', error);
      return;
    }

  users = results.map(row => ({
      id: row.id,
      email: row.email,
      name: row.first_name + " " + row.last_name,
      password: row.password
    }));
  });


  
 





app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }) );
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
    }));

app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
let coaches = [];

app.get('/', checkAuthenticated, (req, res) => {
 
  
    res.render('index.ejs', { name: req.user.name});
    // connection.end();
  });


app.get('/profile', checkAuthenticated, (req, res) => {

  connection.query('select tree_name,access_level from user_trees where user_id = ?', [req.user.id], function (error, results, fields) {
    if (error) throw error;
    coaches = results;
    console.log(coaches);})
    res.render('profile.ejs', { name: req.user.name, coaches: coaches  });
    });

    app.get('/createTree', checkAuthenticated, (req, res) => {
      res.render('createTree.ejs', { name: req.user.name });
      });

app.get('/login', checkNotAuthenticated,(req, res) => {
    res.render('login.ejs');
   
    });

app.post('/login',checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
    }));

app.get('/register',checkNotAuthenticated, (req, res) => {
    res.render('register.ejs');
    });






app.post('/register', checkNotAuthenticated,async (req, res) => {
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        connection.query('INSERT INTO users (first_name,last_name, email, password) VALUES (?,?,?,?)', ["defaultname",req.body.username, req.body.email, hashedPassword], function (error, results, fields) {
            if (error) throw error;
            
            res.redirect('/login');
            connection.end();
          });
        // users.push({
        //     id: Date.now().toString(),
        //     name: req.body.username,
        //     email: req.body.email,
        //     password: hashedPassword
        //     });
          
        // res.redirect('/login');
    }catch{
        res.redirect('/register');
    }
    // console.log(users);
    });


app.delete('/logout', (req, res) => {
    req.logOut(req.user, (err) => {
        if(err) return next(err);
        });
        
    res.redirect('/login');
    })


function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/login');
    }

function checkNotAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return res.redirect('/');
    }
    next();
    }


app.post('/createfamily', (req, res) => {
  const name = req.body.name;
  const dob = req.body.dob;
  const familyName = req.session.familyName;

  const session = driver.session();
  const query = 'CREATE (p:Person {name: $name, dob: $dob, familyName: $familyName})';
  const params = { name, dob, familyName };

  session
    .run(query, params)
    .then(() => {
      session.close();
      console.log('Node created');
      res.redirect('/createfamily');
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Error creating node');
    });
});

app.get('/createfamily', (req, res) => {
   res.render('createFamily.ejs');
});

app.post('/createTree', (req, res) => {
  const { treeName } = req.body;
  
  connection.query('SELECT COUNT(*) AS count FROM user_trees WHERE tree_name = ?', [treeName], (error, results) => {
    if (error) {
      console.error('Error checking tree name uniqueness:', error);
      res.render('createTree', { errorMessage: 'An error occurred. Please try again.' });
    } else {
      const count = results[0].count;

      if (count > 0) {
        res.render('createTree', { errorMessage: 'The tree name is already taken. Please enter a unique name.' });
      } else {
        // Insert the tree name into the user-tree database
        connection.query('INSERT INTO user_trees (user_id, tree_name, access_level) VALUES (?, ?, ?)', [req.user.id, treeName, 'edit'], async (error) => {
          if (error) {
            console.error('Error inserting tree name:', error);
            res.render('createTree', { errorMessage: 'An error occurred. Please try again.' });
          } else {
            
            const ses = driver.session();
            try {
               await ses.run('CREATE (n:Tree {name: $treeName})', { treeName });
               req.session.familyName = treeName;
               
              res.redirect('/createfamily');
            } catch (error) {
              console.error('Error creating starting node in Neo4j:', error);
              res.render('createTree', { errorMessage: 'An error occurred. Please try again.' });
            } finally {
              // connection.end();
               await ses.close();
            }
            // res.redirect('/createTree');
          }
        });
      }
    }
  });
});

app.get('/createRelationship', (req, res) => {
  const query = 'match (n:Person {familyName:"Tree1"}) return n';
  const session = driver.session();
  session.run(query)
    .then(result => {
      const people = result.records.map(record => record.get('n').properties);
      
      res.render('createRelationship.ejs', { people});
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Error retrieving people');
    })
    .finally(() => session.close());
});


app.listen(3000);