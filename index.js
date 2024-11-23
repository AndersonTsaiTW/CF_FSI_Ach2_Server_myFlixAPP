/**
 * @file Movie API Server
 * @description This is the server-side logic for the myFlix application, including user and movie management.
 * @version 1.0.0
 * @author ...
 * @license MIT
 */

const mongoose = require('mongoose');

// Link to the schema in model.js
const Models = require('./model.js');

/**
 * @typedef {Object} Movie
 * @property {string} Title - The title of the movie.
 * @property {Object} Genre - The genre of the movie.
 * @property {string} Genre.Name - The name of the genre.
 * @property {string} Director.Name - The name of the director.
 */
const Movies = Models.Movie;

/**
 * @typedef {Object} User
 * @property {string} Username - The username of the user.
 * @property {string} Password - The hashed password of the user.
 * @property {string} Email - The email address of the user.
 * @property {Date} Birth_date - The birth date of the user.
 * @property {string[]} FavMovies - List of favorite movie IDs.
 */
const Users = Models.User;

// Connect to the MongoDB database
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const express = require('express'),
  app = express();

const bodyParser = require('body-parser');

const uuid = require('uuid');

const morgan = require('morgan');

const fs = require('fs');

const path = require('path');

const cors = require('cors');

const passport = require('passport');
require('./passport');

const { check, validationResult } = require('express-validator');

let allowedOrigins = [
  'http://localhost:8080',
  'http://testsite.com',
  'http://localhost:1234',
  'https://andersoncfmyfilx.netlify.app',
  'http://localhost:4200',
  'https://andersontsaitw.github.io/CF_Ach6_myFlix-Angular-client',
  'https://andersontsaitw.github.io'
];

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

// Create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });

app.use(morgan('combined', { stream: accessLogStream }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.use(express.static('public'));

// Import the auth.js and passport.js
let auth = require('./auth')(app);

/**
 * Displays a welcome message for the root endpoint.
 * @name welcomeMessage
 * @function
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
app.get('/', (req, res) => {
  res.send('Welcome! You are visiting a movie-lover place!');
});

// Validation rules for user registration
const userValidationRules = [
  check('Username', 'Username is required').isLength({ min: 5 }),
  check('Username', 'Username contains non alphanumeric characters').isAlphanumeric(),
  check('Password', 'Password is required').not().isEmpty(),
  check('Email', 'Email is not valid').isEmail()
];

/**
 * Creates a new user with the given details.
 * @name createUser
 * @function
 * @async
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The created user object.
 */
app.post('/users', userValidationRules, async (req, res) => {
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  let hashedPassword = Users.hashPassword(req.body.Password);
  try {
    let user = await Users.findOne({ Username: req.body.Username });
    if (user) {
      return res.status(400).send(req.body.Username + ' already exists');
    } else {
      user = await Users.create({
        Username: req.body.Username,
        Password: hashedPassword,
        Email: req.body.Email,
        Birth_date: req.body.Birth_date
      });
      res.status(201).json(user);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error:' + error);
  }
});

/**
 * Retrieves user information by their username.
 * @name getUser
 * @function
 * @async
 * @param {string} Username - The username of the user to retrieve.
 * @returns {Object} The user object if found.
 */
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  console.log('Fetching user:', req.params.Username);
  try {
    const user = await Users.findOne({ Username: req.params.Username });
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

// Validation rules for updating user
const updateUserValidationRules = [
  check('Username', 'Username is required').isLength({ min: 5 }),
  check('Username', 'Username contains non alphanumeric characters').isAlphanumeric(),
  check('Password', 'Password is required').not().isEmpty(),
  check('Email', 'Email is not valid').isEmail()
];

/**
 * Updates user information.
 * @name updateUser
 * @function
 * @async
 * @param {string} Username - The username to update.
 * @param {Object} req.body - The user data to update.
 * @returns {Object} The updated user object.
 */
app.put('/users/:Username', passport.authenticate('jwt', { session: false }), updateUserValidationRules, async (req, res) => {
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(402).json({ errors: errors.array() });
  }
  if (req.user.Username !== req.params.Username) {
    return res.status(400).send('Permission denied');
  }
  let hashedPassword = Users.hashPassword(req.body.Password);
  try {
    const updatedUser = await Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $set: {
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birth_date: req.body.Birth_date
        }
      },
      { new: true }
    );
    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error:' + err);
  }
});

/**
 * Deletes a user by their username.
 * @name deleteUser
 * @function
 * @async
 * @param {string} Username - The username to delete.
 * @returns {string} A confirmation message upon successful deletion.
 */
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  if (req.user.Username !== req.params.Username) {
    return res.status(400).send('Permission denied');
  }
  try {
    const user = await Users.findOneAndDelete({ Username: req.params.Username });
    if (!user) {
      res.status(400).send(req.params.Username + ' was not found.');
    } else {
      res.status(200).send(req.params.Username + ' was deleted.');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error:' + err);
  }
});

/**
 * Adds a movie to the user's favorite list.
 * @name addFavoriteMovie
 * @function
 * @async
 * @param {string} Username - The username.
 * @param {string} movieID - The movie ID to add.
 * @returns {Object} The updated user object with the new favorite movie.
 */
app.post('/users/:Username/movies/:movieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
  if (req.user.Username !== req.params.Username) {
    return res.status(400).send('Permission denied');
  }
  try {
    const updatedUser = await Users.findOneAndUpdate(
      { Username: req.params.Username },
      { $push: { FavMovies: req.params.movieID } },
      { new: true }
    );
    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error:' + err);
  }
});

/**
 * Removes a movie from the user's favorite list.
 * @name removeFavoriteMovie
 * @function
 * @async
 * @param {string} Username - The username.
 * @param {string} movieID - The movie ID to remove.
 * @returns {Object} The updated user object without the removed movie.
 */
app.delete('/users/:Username/movies/:movieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
  if (req.user.Username !== req.params.Username) {
    return res.status(400).send('Permission denied');
  }
  try {
    const updatedUser = await Users.findOneAndUpdate(
      { Username: req.params.Username },
      { $pull: { FavMovies: req.params.movieID } },
      { new: true }
    );
    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error:' + err);
  }
});

/**
 * Retrieves a list of all movies in the database.
 * @name getAllMovies
 * @function
 * @async
 * @returns {Object[]} A list of movie objects.
 */
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const movies = await Movies.find();
    res.status(200).json(movies);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

/**
 * Retrieves information about a specific movie by its title.
 * @name getMovieByTitle
 * @function
 * @async
 * @param {string} title - The title of the movie.
 * @returns {Object} The movie object if found.
 */
app.get('/movies/:title', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const decodedTitle = decodeURIComponent(req.params.title);
  try {
    const movie = await Movies.findOne({ Title: decodedTitle });
    if (!movie) {
      res.status(404).send('Movie not found');
    } else {
      res.status(201).json(movie);
    }
  } catch (err) {
    console.error(err);
    res.status(400).send('Error: ' + err);
  }
});

/**
 * Retrieves information about a specific genre by name.
 * @name getGenreByName
 * @function
 * @async
 * @param {string} genreName - The name of the genre.
 * @returns {Object} The genre object with its description.
 */
app.get('/movies/genre/:genreName', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const decodedGenre = decodeURIComponent(req.params.genreName);
    const movie = await Movies.findOne({ 'Genre.Name': decodedGenre });
    if (!movie) {
      res.status(404).send(decodedGenre + ' not found');
    } else {
      res.status(200).json(movie.Genre);
    }
  } catch (err) {
    console.error(err);
    res.status(400).send('Error:' + err);
  }
});

/**
 * Retrieves information about a specific director by name.
 * @name getDirectorByName
 * @function
 * @async
 * @param {string} directorName - The name of the director.
 * @returns {Object} The director object with details.
 */
app.get('/movies/director/:directorName', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const decodedDirector = decodeURIComponent(req.params.directorName);
    const movie = await Movies.findOne({ 'Director.Name': decodedDirector });
    if (!movie) {
      res.status(404).send(decodedDirector + ' is not found.');
    } else {
      res.status(200).json(movie.Director);
    }
  } catch (err) {
    console.error(err);
    res.status(400).send('Error: ' + err);
  }
});

// Basic message to check if the host is running
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Listening on port ' + port);
});
