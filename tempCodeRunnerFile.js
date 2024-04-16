const express = require('express'),
  morgan = require('morgan'),
  fs = require('fs'), // import built in node modules fs and path 
  path = require('path');

const app = express();
// create a write stream (in append mode)
// a ‘log.txt’ file is created in root directory
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})

// setup the logger
app.use(morgan('combined', {stream: accessLogStream}));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send('Welcome! You are visiting a movie-lover place!');
});

app.get('/movies', (req, res) => {
  fs.readFile(path.join(__dirname, 'topMovies.json'), 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error reading topMovies.json');
      return;
    }
    const topMovies = JSON.parse(data);
    res.json(topMovies);
  });
});

app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});