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
 * @property {string} Description - The description of the movie.
 * @property {Object} Genre - The genre of the movie.
 * @property {string} Genre.Name - The name of the genre.
 * @property {string} Genre.Description - The description of the genre.
 * @property {Object} Director - The director of the movie.
 * @property {string} Director.Name - The name of the director.
 * @property {string} Director.Bio - The biography of the director.
 * @property {string} Director.Birth - The birth year of the director.
 * @property {string} Director.Death - The death year of the director (if applicable).
 * @property {string} ImagePath - The image URL of the movie.
 * @property {boolean} Featured - Indicates if the movie is featured.
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
 * @param {express.Request} req - The request object.
 * @param {express.Response} res - The response object.
 * @returns {void}
 */
app.get('/', (req, res) => {
  res.send('Welcome! You are visiting a movie-lover place!');
});

// Validation rules for user registration
const userValidationRules = [
  check('Username', 'Username is required and must be at least 5 characters long.').isLength({ min: 5 }),
  check('Username', 'Username contains non-alphanumeric characters - not allowed.').isAlphanumeric(),
  check('Password', 'Password is required').not().isEmpty(),
  check('Email', 'Email does not appear to be valid').isEmail()
];

/**
 * Allow new users to register.
 * @name createUser
 * @function
 * @async
 * @param {express.Request} req - The request object containing user registration details.
 * @param {express.Response} res - The response object.
 * @returns {Object} The created user object.
 * @example
 * // Request body format:
 * {
 *   "Username": "AndersonTsai",
 *   "Password": "pass666",
 *   "Email": "AndersonTsai@example.com",
 *   "Birth_date": "1987-06-10"
 * }
 * // Response body format:
 * {
 *   "Username": "AndersonTsai",
 *   "Password": "hashedPassword",
 *   "Email": "AndersonTsai@example.com",
 *   "Birth_date": "1987-06-10T00:00:00.000Z",
 *   "FavMovies": [],
 *   "_id": "6630822b1894974d52d616fe",
 *   "__v": 0
 * }
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
 * @param {express.Request} req - The request object.
 * @param {string} req.params.Username - The username of the user to retrieve.
 * @param {express.Response} res - The response object.
 * @returns {Object} The user object if found.
 * @requires passport
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
  check('Username', 'Username is required and must be at least 5 characters long.').isLength({ min: 5 }),
  check('Username', 'Username contains non-alphanumeric characters - not allowed.').isAlphanumeric(),
  check('Password', 'Password is required').not().isEmpty(),
  check('Email', 'Email does not appear to be valid').isEmail()
];

/**
 * Allow users to update their user info (username, password, email, date of birth).
 * @name updateUser
 * @function
 * @async
 * @param {express.Request} req - The request object containing updated user details.
 * @param {string} req.params.Username - The username to update.
 * @param {express.Response} res - The response object.
 * @returns {Object} The updated user object.
 * @requires passport
 * @example
 * // Request body format:
 * {
 *   "Username": "AndersonTsai",
 *   "Password": "newPass123",
 *   "Email": "newemail@example.com",
 *   "Birth_date": "1987-06-11"
 * }
 * // Response body format:
 * {
 *   "_id": "6630822b1894974d52d616fe",
 *   "Username": "AndersonTsai",
 *   "Password": "hashedNewPassword",
 *   "Email": "newemail@example.com",
 *   "Birth_date": "1987-06-11T00:00:00.000Z",
 *   "FavMovies": [],
 *   "__v": 0
 * }
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
 * Allow existing users to deregister.
 * @name deleteUser
 * @function
 * @async
 * @param {express.Request} req - The request object.
 * @param {string} req.params.Username - The username to delete.
 * @param {express.Response} res - The response object.
 * @returns {string} A confirmation message upon successful deletion.
 * @requires passport
 * @example
 * // Response:
 * "User AndersonTsai was deleted."
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
 * Allow users to add a movie to their list of favorites.
 * @name addFavoriteMovie
 * @function
 * @async
 * @param {express.Request} req - The request object.
 * @param {string} req.params.Username - The username.
 * @param {string} req.params.movieID - The movie ID to add.
 * @param {express.Response} res - The response object.
 * @returns {Object} The updated user object with the new favorite movie.
 * @requires passport
 * @example
 * // Response body format:
 * {
 *   "_id": "6630822b1894974d52d616fe",
 *   "Username": "AndersonTsai",
 *   "Password": "hashedPassword",
 *   "Email": "AndersonTsai@example.com",
 *   "Birth_date": "1987-06-11T00:00:00.000Z",
 *   "FavMovies": [
 *     "66286858ded157b056117b81"
 *   ],
 *   "__v": 0
 * }
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
 * Allow users to remove a movie from their list of favorites.
 * @name removeFavoriteMovie
 * @function
 * @async
 * @param {express.Request} req - The request object.
 * @param {string} req.params.Username - The username.
 * @param {string} req.params.movieID - The movie ID to remove.
 * @param {express.Response} res - The response object.
 * @returns {Object} The updated user object without the removed movie.
 * @requires passport
 * @example
 * // Response body format:
 * {
 *   "_id": "6630822b1894974d52d616fe",
 *   "Username": "AndersonTsai",
 *   "Password": "hashedPassword",
 *   "Email": "AndersonTsai@example.com",
 *   "Birth_date": "1987-06-11T00:00:00.000Z",
 *   "FavMovies": [],
 *   "__v": 0
 * }
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
 * Return a list of ALL movies to the user.
 * @name getAllMovies
 * @function
 * @async
 * @param {express.Request} req - The request object.
 * @param {express.Response} res - The response object.
 * @returns {Object[]} A JSON object holding data about all the movies.
 * @requires passport
 * @example
 * // Response body format:
 * [
 *   {
 *     "Title": "The Grudge",
 *     "Description": "A horror movie about a cursed house.",
 *     "Genre": { "Name": "Horror", "Description": "Scary and thrilling movies." },
 *     "Director": { "Name": "Takashi Shimizu", "Bio": "Japanese director", "Birth": "1968" },
 *     "ImagePath": "https://example.com/grudge.jpg",
 *     "Featured": true
 *   },
 *   // ... more movies
 * ]
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
 * Return data (description, genre, director, image URL, whether it's featured or not) about a single movie by title to the user.
 * @name getMovieByTitle
 * @function
 * @async
 * @param {express.Request} req - The request object.
 * @param {string} req.params.title - The title of the movie (URL-encoded).
 * @param {express.Response} res - The response object.
 * @returns {Object} A JSON object holding data about the specific movie.
 * @requires passport
 * @example
 * // Request URL:
 * /movies/The%20Grudge
 * // Response body format:
 * {
 *   "Title": "The Grudge",
 *   "Description": "A horror movie about a cursed house.",
 *   "Genre": { "Name": "Horror", "Description": "Scary and thrilling movies." },
 *   "Director": { "Name": "Takashi Shimizu", "Bio": "Japanese director", "Birth": "1968" },
 *   "ImagePath": "https://example.com/grudge.jpg",
 *   "Featured": true
 * }
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
 * Return data about a genre (description) by name/title (e.g., “Thriller”).
 * @name getGenreByName
 * @function
 * @async
 * @param {express.Request} req - The request object.
 * @param {string} req.params.genreName - The name of the genre (URL-encoded).
 * @param {express.Response} res - The response object.
 * @returns {Object} A JSON object holding data about a specific genre, including name and description.
 * @requires passport
 * @example
 * // Request URL:
 * /movies/genre/Action
 * // Response body format:
 * {
 *   "Name": "Action",
 *   "Description": "Should contain numerous scenes where action is spectacular and usually destructive..."
 * }
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
 * Return data about a director (bio, birth year, death year) by name.
 * @name getDirectorByName
 * @function
 * @async
 * @param {express.Request} req - The request object.
 * @param {string} req.params.directorName - The name of the director (URL-encoded).
 * @param {express.Response} res - The response object.
 * @returns {Object} A JSON object holding data about a specific director, including name, bio, birth, and death.
 * @requires passport
 * @example
 * // Request URL:
 * /movies/director/Francis%20Ford%20Coppola
 * // Response body format:
 * {
 *   "Name": "Francis Ford Coppola",
 *   "Bio": "American film director, producer, and screenwriter...",
 *   "Birth": "1939",
 *   "Death": null
 * }
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
