if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
    }

const express = require('express');
const app = express();

const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride= require('method-override');
const path = require('path');


var users = [];

const initializePassport = require('./passport-config');
initializePassport(passport, email => users.find(user => user.email === email), id => users.find(user => user.id === id));


const createRelationshipFunc = require('./controllers/createRelationship');
const createRelationshipGetFunc = require('./controllers/createRelationshipGet');
const createTreePostFunc = require('./controllers/createTree');
const createFamPostFunc = require('./controllers/createFamily');
const registerPostFunc = require('./controllers/register');
const deleteTreePostFunc = require('./controllers/deleteTreePost');
const getMembersFunc = require('./controllers/getMmebers');

const { get } = require('http');
// const updateUsersFunc = require('./controllers/updateUsers');



app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
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

var mysql = require('mysql');
const { getUsersFunc } = require('./controllers/getUsers');
const editFamilyMembersGetFunc = require('./controllers/editMembersGet');
const editFamilyMemberPostFunc = require('./controllers/editMemberPost');
const deleteRelationshipGetFunc = require('./controllers/deleteRelationshipGet');
const deleteRelationshipPostFunc = require('./controllers/deleteRelationshipPost');
const deleteFamilyMemberPostFunc = require('./controllers/deleteFamilyMemeberPost');
const inviteMembersPostFunc = require('./controllers/inviteMembersPost');
const forgotPasswordPostFunc = require('./controllers/forgotPasswordPost');
  var connection = mysql.createConnection({
    host     : process.env.RDS_HOSTNAME,
    user     : process.env.RDS_USERNAME,
    password : process.env.RDS_PASSWORD,
  //   port     : process.env.RDS_PORT,
    database : process.env.RDS_DB_NAME
  });
 
  
  refreshUsers(); 
  
app.get('/', checkAuthenticated, (req, res) => {
 
  
    res.render('index.ejs', { name: req.user.name});
    // connection.end();
  });


app.get('/profile', checkAuthenticated, async (req, res) => {
  try {
    const results1 = await connection.query('SELECT tree_name, access_level FROM user_trees WHERE user_id = ?', [req.user.id], function(err, results, fields){ 
      if(err) throw err;
      console.log(results);
      const coaches = results;
      res.render('profile.ejs', { name: req.user.name, coaches: coaches });
      
    });
  } catch (error) {
    // Handle any errors that occurred during the database query or rendering
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// ******************************************************************************************************************************
// Login: Get and Post
// ******************************************************************************************************************************
app.get('/login', checkNotAuthenticated,async (req, res) => {
  users = await getUsersFunc();
    res.render('login.ejs');
   
    });


app.post('/login',checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
    }));

// *******************************************************************************************************************************
//forgot password
// *******************************************************************************************************************************
app.get('/forgotPassword', checkNotAuthenticated,async (req, res) => {
    res.render('forgotPassword.ejs');
    });

app.post('/forgotPassword',checkNotAuthenticated, forgotPasswordPostFunc);

// ******************************************************************************************************************************
// Register: Get and Post
// ******************************************************************************************************************************
app.get('/register',checkNotAuthenticated, (req, res) => {
    res.render('register.ejs');
    });
// send users with this post request

app.post('/register', checkNotAuthenticated, (req, res) => {
  registerPostFunc(req, res, users);
});


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

    async function refreshUsers(){
      users = await getUsersFunc();
      return users;
    }

    

// ******************************************************************************************************************************
// CreateFamily: Get and Post
// ******************************************************************************************************************************
app.get('/createfamily', checkAuthenticated,(req, res) => {
   res.render('createFamily.ejs',{tree_name: req.session.familyName });
});

app.get('/createfamily/:family_name', checkAuthenticated,async (req, res) => {
  console.log(req.session.people);
  req.session.familyName = req.params.family_name;
  // console.log(getMembersFunc(req.params.family_name)  );
  res.render('createFamily.ejs',{tree_name: req.session.familyName , members : await getMembersFunc(req.params.family_name)} );
});

app.post('/createfamily', createFamPostFunc);

// *******************************************************************************************************************************
// EditFamilyMember: Get and Post
// *******************************************************************************************************************************

app.get( '/editFamilyMember/:tree_name', checkAuthenticated,editFamilyMembersGetFunc);
app.post('/editFamilyMember/:tree_name', checkAuthenticated,editFamilyMemberPostFunc);

// ******************************************************************************************************************************
// CreateTree: Get and Post
// ******************************************************************************************************************************

app.get('/createTree', checkAuthenticated, (req, res) => {
  res.render('createTree.ejs', { name: req.user.name });
  });

app.post('/createTree', createTreePostFunc);

// ******************************************************************************************************************************
// DeleteTree: Get
// ******************************************************************************************************************************

app.get('/deleteTree/:tree_name', checkAuthenticated, (req, res) => {
  res.render('deleteTree.ejs', { tree_name: req.params.tree_name });
  });

app.post('/deleteTree/:tree_name', checkAuthenticated, deleteTreePostFunc);

// ******************************************************************************************************************************
// createRelationship: Get and Post
// ******************************************************************************************************************************

app.get( '/createRelationship',            checkAuthenticated,createRelationshipGetFunc);
app.get( '/createRelationship/:tree_name', checkAuthenticated,createRelationshipGetFunc);
app.post('/createRelationship/:tree_name', checkAuthenticated,createRelationshipFunc);

// *******************************************************************************************************************************
// deleteRelationship: Get and Post
// *******************************************************************************************************************************

app.get( '/deleteRelationship/:tree_name', checkAuthenticated, deleteRelationshipGetFunc );
app.post('/deleteRelationship/:tree_name', checkAuthenticated, deleteRelationshipPostFunc );

// ******************************************************************************************************************************
// deleteFamilyMember: Get and Post
// ******************************************************************************************************************************

app.get('/deleteFamilyMember/:tree_name', checkAuthenticated, async (req, res) => {
  res.render('deleteFamilyMember.ejs', { tree_name: req.params.tree_name , people: await getMembersFunc(req.params.tree_name)}
  )});

app.post('/deleteFamilyMember/:tree_name', checkAuthenticated, deleteFamilyMemberPostFunc);


app.get('/invite/:tree_name', checkAuthenticated, (req, res) => {
  res.render('invite.ejs', { tree_name: req.params.tree_name });
  });

app.post('/invite/:tree_name', checkAuthenticated,inviteMembersPostFunc);

// ******************************************************************************************************************************
// Get details of all members of a tree from neo4j
// ******************************************************************************************************************************




app.listen(3000);

