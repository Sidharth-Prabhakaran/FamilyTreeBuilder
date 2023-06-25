if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
    }

const express = require('express');
const app = express();

const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride= require('method-override');

let users = [];
const bodyParser = require('body-parser');

const initializePassport = require('./passport-config');
initializePassport(passport, email => users.find(user => user.email === email), id => users.find(user => user.id === id));






var mysql = require('mysql');
const createRelationshipFunc = require('./controllers/createRelationship');
const createRelationshipGetFunc = require('./controllers/createRelationship');
const createTreePostFunc = require('./controllers/createTree');
const createFamPostFunc = require('./controllers/createFamily');
const registerPostFunc = require('./controllers/register');


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

// ******************************************************************************************************************************
// Login: Get and Post
// ******************************************************************************************************************************
app.get('/login', checkNotAuthenticated,(req, res) => {
    res.render('login.ejs');
   
    });

app.post('/login',checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
    }));

// ******************************************************************************************************************************
// Register: Get and Post
// ******************************************************************************************************************************
app.get('/register',checkNotAuthenticated, (req, res) => {
    res.render('register.ejs');
    });

app.post('/register', checkNotAuthenticated,registerPostFunc);


// ******************************************************************************************************************************
// Logout
// ******************************************************************************************************************************
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

    

// ******************************************************************************************************************************
// CreateFamily: Get and Post
// ******************************************************************************************************************************
app.get('/createfamily', checkAuthenticated,(req, res) => {
   res.render('createFamily.ejs');
});

app.post('/createfamily', createFamPostFunc);

// ******************************************************************************************************************************
// CreateTree: Get and Post
// ******************************************************************************************************************************
app.get('/createTree', checkAuthenticated, (req, res) => {
  res.render('createTree.ejs', { name: req.user.name });
  });
app.post('/createTree', createTreePostFunc);

// ******************************************************************************************************************************
// createRelationship: Get and Post
// ******************************************************************************************************************************
app.get('/createRelationship', checkAuthenticated,createRelationshipGetFunc);

app.post('/createRelationship', checkAuthenticated,createRelationshipFunc);


app.listen(3000);

// Arun's Branch