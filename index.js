// the modules about database
const mongoose = require('mongoose');
// link to the schema in model.js
const Models = require('./model.js');
const Movies = Models.Movie;
const Users = Models.User;
// link to the Local MongoDB - cfMovie
// mongoose.connect('mongodb://localhost:27017/cfMovie',{useNewUrlParser: true, useUnifiedTopology: true});
// link to the Remote Mongo Atlas - cfMovie
mongoose.connect(process.env.CONNECTION_URI,{useNewUrlParser: true, useUnifiedTopology: true});

// require the necessary modules
const express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  uuid = require('uuid'),
  morgan = require('morgan'),
  fs = require('fs'), // import built in node modules fs and path 
  path = require('path');

// the modules about cors
// cors is used to control the login location
const cors = require('cors');
let allowedOrigins = ['http://localhost:8080', 'http://testsite.com', 'http://localhost:1234', 'https://andersoncfmyfilx.netlify.app/'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) { // If a specific origin isn’t found on the list of allowed origins
      let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
      return callback(new Error(message), false);
    }
    return callback(null, true);
  }
}));

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

// create a write stream (in append mode)
// a ‘log.txt’ file is created in root directory
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'});

// setup the logger
app.use(morgan('combined', {stream: accessLogStream}));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.use(express.static('public'));

// import the auth.js and passport.js
let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

// import the express-validator modules
const {check, validationResult} = require('express-validator');
// const { isEmail } = require('validator');

// Welcome message
app.get('/', (req, res) => {
  res.send('Welcome! You are visiting a movie-lover place!');
});

// CREATE a new user
app.post('/users',
  [
    // the way to use check: check( object, the message return to user when it get wrong).rule
    check('Username', 'Username is required').isLength({min: 5}),
    check('Username','Username contains non alphanu meric characters').isAlphanumeric(),
    check('Password','Password is required').not().isEmpty(),
    check('Email', 'Email is not valid').isEmail()
  ], async(req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors:errors.array()});
    }
  let hashedPassword = Users.hashPassword(req.body.Password);
  await Users.findOne({ Username: req.body.Username
  })
  .then((user) => {
    if (user) {
      return res.status(400).send(req.body.Username + 'already exists');
    } else {
      Users
      .create({
        Username: req.body.Username,
        Password: hashedPassword,
        Email: req.body.Email,
        Birth_date: req.body.Birth_date
      })
      .then((user) => {res.status(201).json(user)
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error:' + error);
      })
    }
  })
  .catch((error) =>{
    console.error(error);
    res.status(500).send('Error:' + error);
  });
});

// UPDATE a user's information
app.put('/users/:Username', 
[
  passport.authenticate('jwt', { session: false }),
  check('Username', 'Username is required').isLength({min: 5}),
  check('Username','Username contains non alphanu meric characters').isAlphanumeric(),
  check('Password','Password is required').not().isEmpty(),
  check('Email', 'Email is not valid').isEmail()
],
  async(req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(402).json({ errors: errors.array() });
    }
  // CONDITION TO CHECK ADDED HERE
    if (req.user.Username !== req.params.Username) {
      return res.status(400).send('Permission denied');
    }
  // CONDITION ENDS
  let hashedPassword = Users.hashPassword(req.body.Password);
  await Users.findOneAndUpdate(
    {Username: req.params.Username},
    { $set: 
      {
        Username : req.body.Username,
        Password : hashedPassword,
        Email : req.body.Email,
        // be careful, if the column's names are different between mongoose schema and real MongoDB
        // it will create a new column directly. so keep them consistent
        // EX: Birth_date( = schema and MongoDB): req.body.Birthday( = request raw data's column)
        // if the code here(EX:Birth_date) and schema(EX:Birthday) are not equal, data will not be transfer
        Birth_date: req.body.Birth_date
      }
    },
  { new: true }) //make sure the update
  .then((updatedUser) => {
    res.json(updatedUser);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error:' + err);
  })
});

// CREATE a movie in user's faverite movie list
app.post('/users/:Username/movies/:movieID',
  passport.authenticate('jwt', { session: false }),
  async(req, res) => {
  if (req.user.Username !== req.params.Username) {
    return res.status(400).send('Permission denied');
  }
  await Users.findOneAndUpdate(
    {Username: req.params.Username},
    {$push: {FavMovies: req.params.movieID}},
    {new:true})
    .then((updateUser) => {
      res.json(updateUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error:' + err);
    });
  }
);

// DELETE a movie in user's faverite movie list
app.delete('/users/:Username/movies/:movieID', passport.authenticate('jwt', { session: false }), async(req, res) => {
  if (req.user.Username !== req.params.Username) {
    return res.status(400).send('Permission denied');
  }
  await Users.findOneAndUpdate(
    { Username: req.params.Username },
    { $pull: {FavMovies: req.params.movieID} },
    {new:true})
    .then((updatedUser) => {
      res.json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error:' + err);
    });
  }
);

// DELETE a user
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), async(req, res) => {
  if (req.user.Username !== req.params.Username) {
    return res.status(400).send('Permission denied');
  }
  await Users.findOneAndDelete(
    { Username : req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + ' was not found.');
      } else {
        res.status(200).send(req.params.Username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error:' + err);
    })
  }
);

// READ all movie list
app.get('/movies', passport.authenticate('jwt', { session: false }), async(req, res) => {
  await Movies.find()
  .then((movies) => {
    res.status(200).json(movies);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

// READ movie's information by title
app.get('/movies/:title', passport.authenticate('jwt', { session: false }), async(req, res) => {
  const decodedTitle = decodeURIComponent(req.params.title);
  await Movies.findOne({Title: decodedTitle})
  .then((movie) => { 
    res.status(201).json(movie);
  })
  .catch((err) => {
    console.error(err);
    res.status(400).send('Error: ' + err);
  });
});

//READ genre by its name
app.get('/movies/genre/:genreName', passport.authenticate('jwt', { session: false }), async(req, res) => {
  try {
  const decodedGeren = decodeURIComponent(req.params.genreName);
  const movie = await Movies.findOne({ 'Genre.Name': decodedGeren });
  if (!movie) {
    res.status(404).send(decodedGeren + 'not found');
  }
    res.status(200).json(movie.Genre);
  } catch (err) {
    console.error(err);
    res.status(400).send('Error:' + err);
  }
});

// READ diretion's information by its name
app.get('/movies/director/:directorName', passport.authenticate('jwt', { session: false }), async(req, res) => {
  try {
    const decodedDirectore = decodeURIComponent(req.params.directorName);
    const movie = await Movies.findOne({'Director.Name': decodedDirectore});
    if (!movie) {
      res.status(404).send( decodedDirectore + 'is not found.');
    }
    res.status(200).json(movie.Director);
  } catch (err) {
    console.error(err);
    res.status(400).send('Error: ' + err);
  }
});

// basic message to check if the host is running
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0' , () => {
  console.log('Listening on port ' + port);
});