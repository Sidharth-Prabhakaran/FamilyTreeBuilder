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



// var driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'Mother@123'));
// var ses = driver.session();

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
    // Perform database operations here
  });

  const query = 'SELECT * FROM users';

  connection.query(query, (error, results, fields) => {
    if (error) {
      console.error('Error executing query:', error);
      return;
    }
  
    // Format the results as an array of user objects
  users = results.map(row => ({
      id: row.id,
      email: row.email,
      name: row.first_name + " " + row.last_name,
      password: row.password
      // Add more properties as needed
    }));
  
    console.log('Users:', users);
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

app.get('/', checkAuthenticated, (req, res) => {
  res.render('index.ejs', { name: req.user.name });
});

app.get('/profile', checkAuthenticated, (req, res) => {
    res.render('profile.ejs', { name: req.user.name });
    });

    app.get('/createTree', checkAuthenticated, (req, res) => {
      res.render('createTree.ejs', { name: req.user.name });
      });

app.get('/login', checkNotAuthenticated,(req, res) => {
    res.render('login.ejs');
    // ses.run('MATCH (n:COACH) RETURN n LIMIT 25')
    // .then(function(result){
    //     result.records.forEach(function(record){
    //         console.log(record._fields[0].properties.name);
    //     });
    // })
    // .catch(function(err){
    //     console.log(err);
    // }
    // );
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


app.listen(3000);