const express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  uuid = require('uuid'),
  morgan = require('morgan'),
  fs = require('fs'), // import built in node modules fs and path 
  path = require('path');

app.use(bodyParser.json());

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

let users = [
  {
    "id": 1,
    "name": "kim",
    "favoriteMovie": []
  },
  {
    "id": 2,
    "name": "Jean",
    "favoriteMovie": ["Underwater"]
  }
]

let movies = [
  {
    "title": "The Grudge",
    "year": 2020,
    "director": {
      "name": "Fred Astaire",
      "birth": "1899",
      "death": "1987",
      "bio": "actor,miscellaneous,producer"
    },
    "cast": [
      "Andrea Riseborough",
      "Demián Bichir",
      "John Cho",
      "Betty Gilpin",
      "Lin Shaye",
      "Jacki Weaver"
    ],
    "genres": [
      "Horror",
      "Supernatural"
    ],
    "href": "The_Grudge_(2020_film)",
    "extract": "The Grudge is a 2020 American psychological supernatural horror film written and directed by Nicolas Pesce. Originally announced as a reboot of the 2004 American remake and the original 2002 Japanese horror film Ju-On: The Grudge, the film ended up taking place before and during the events of the 2004 film and its two direct sequels, and is the fourth installment in the American The Grudge film series. The film stars Andrea Riseborough, Demián Bichir, John Cho, Betty Gilpin, Lin Shaye, and Jacki Weaver, and follows a police officer who investigates several murders that are seemingly connected to a single house.",
    "thumbnail": "https://upload.wikimedia.org/wikipedia/en/3/34/The_Grudge_2020_Poster.jpeg",
    "thumbnail_width": 220,
    "thumbnail_height": 326
  },
  {
    "title": "Underwater",
    "year": 2020,
    "director": {
      "name": "Lauren Bacall",
      "birth": "1924",
      "death": "2014",
      "bio": "actress,soundtrack,archive_footage"
    },
    "cast": [
      "Kristen Stewart",
      "Vincent Cassel",
      "Jessica Henwick",
      "John Gallagher Jr.",
      "Mamoudou Athie",
      "T.J. Miller"
    ],
    "genres": [
      "Action",
      "Horror",
      "Science Fiction"
    ],
    "href": "Underwater_(film)",
    "extract": "Underwater is a 2020 American science fiction action horror film directed by William Eubank. The film stars Kristen Stewart, Vincent Cassel, Jessica Henwick, John Gallagher Jr., Mamoudou Athie, and T.J. Miller.",
    "thumbnail": "https://upload.wikimedia.org/wikipedia/en/4/4a/Underwater_poster.jpeg",
    "thumbnail_width": 250,
    "thumbnail_height": 398
  },
  {
    "title": "Like a Boss",
    "year": 2020,
    "director": {
      "name": "Fred Astaire",
      "birth": "1899",
      "death": "1987",
      "bio": "actor,miscellaneous,producer"
    },
    "cast": [
      "Tiffany Haddish",
      "Rose Byrne",
      "Salma Hayek",
      "Jennifer Coolidge",
      "Billy Porter"
    ],
    "genres": [
      "Comedy"
    ],
    "href": "Like_a_Boss_(film)",
    "extract": "Like a Boss is a 2020 American comedy film directed by Miguel Arteta, written by Sam Pitman and Adam Cole-Kelly, and starring Tiffany Haddish, Rose Byrne, and Salma Hayek. The plot follows two friends who attempt to take back control of their cosmetics company from an industry titan.",
    "thumbnail": "https://upload.wikimedia.org/wikipedia/en/9/9a/LikeaBossPoster.jpg",
    "thumbnail_width": 259,
    "thumbnail_height": 383
  },
  {
    "title": "Three Christs",
    "year": 2020,
    "director": {
      "name": "Lauren Bacall",
      "birth": "1924",
      "death": "2014",
      "bio": "actress,soundtrack,archive_footage"
    },
    "cast": [
      "Richard Gere",
      "Peter Dinklage",
      "Walton Goggins",
      "Bradley Whitford"
    ],
    "genres": [
      "Drama"
    ],
    "href": "Three_Christs",
    "extract": "Three Christs, also known as State of Mind, is a 2017 American drama film directed, co-produced, and co-written by Jon Avnet and based on Milton Rokeach's nonfiction book The Three Christs of Ypsilanti. It screened in the Gala Presentations section at the 2017 Toronto International Film Festival. The film is also known as: Three Christs of Ypsilanti, The Three Christs of Ypsilanti, Three Christs of Santa Monica, and The Three Christs of Santa Monica.",
    "thumbnail": "https://upload.wikimedia.org/wikipedia/en/a/a1/Three_Christs_poster.jpg",
    "thumbnail_width": 259,
    "thumbnail_height": 383
  },
  {
    "title": "Inherit the Viper",
    "year": 2020,
    "director": {
      "name": "Brigitte Bardot",
      "birth": "1934",
      "death": "Nan",
      "bio": "actress,music_department,producer"
    },
    "cast": [
      "Josh Hartnett",
      "Margarita Levieva",
      "Chandler Riggs",
      "Bruce Dern",
      "Owen Teague"
    ],
    "genres": [
      "Crime",
      "Drama"
    ],
    "href": "Inherit_the_Viper",
    "extract": "Inherit the Viper is a 2019 American crime drama film directed by Anthony Jerjen, in his feature directorial debut, from a screenplay by Andrew Crabtree. It stars Josh Hartnett, Margarita Levieva, Chandler Riggs, Bruce Dern, Valorie Curry, Owen Teague, and Dash Mihok.",
    "thumbnail": "https://upload.wikimedia.org/wikipedia/en/1/1c/Inherit_the_Viper_%282019%29_Film_Poster.jpg",
    "thumbnail_width": 236,
    "thumbnail_height": 350
  },
  {
    "title": "The Sonata",
    "year": 2020,
    "director": {
      "name": "Ingmar Bergman",
      "birth": "1918",
      "death": "2007",
      "bio": "writer,director,actor"
    },
    "cast": [
      "Freya Tingley",
      "Simon Abkarian",
      "Rutger Hauer",
      "James Faulkner"
    ],
    "genres": [
      "Mystery",
      "Thriller"
    ],
    "href": "The_Sonata_(film)",
    "extract": "The Sonata is a 2018 mystery thriller film, directed by Andrew Desmond, from a screenplay by Desmond and Arthur Morin. It stars Freya Tingley, Simon Abkarian, James Faulkner, Rutger Hauer, Matt Barber and James Kermack. It was released in the United States on January 10, 2020, by Screen Media Films. It grossed $146,595 at the box office and received mixed reviews from critics.",
    "thumbnail": "https://upload.wikimedia.org/wikipedia/en/1/13/The_Sonata_%282018%29_Film_Poster.jpg",
    "thumbnail_width": 246,
    "thumbnail_height": 350
  }
];

// Welcome message
app.get('/', (req, res) => {
  res.send('Welcome! You are visiting a movie-lover place!');
});
// CREATE a new user
app.post('/users', (req, res) => {
  const newUser = req.body;

  if (newUser.name) {
    newUser.id = uuid.v4();
    users.push(newUser);
    res.status(201).json(newUser)
  } else {
    res.status(400).send('users need names')
  }
});
// UPDATE a user's information
app.put('/users/:id', (req, res) => {
  const {id} = req.params;
  const updateUser = req.body;

  let user = users.find( user => user.id == id);

  if (user) {
    user.name = updateUser.name;
    user.password = updateUser.password;
    user.email = updateUser.email;
    user.birthDay = updateUser.birthDay;
    res.status(200).json(user);
  } else {
    res.status(400).send('no this user')
  }
});
// CREATE a movie in user's faverite movie list
app.post('/users/:id/:movieTitle', (req, res) => {
  const { id, movieTitle } = req.params;
  let user = users.find( user => user.id == id);

  if (user) {
    user.favoriteMovie.push(movieTitle);
    res.status(200).send(`${movieTitle} has been added to user ${id}'s list`);
  } else {
    res.status(400).send('no this user')
  }
});
// DELETE a movie in user's faverite movie list
app.delete('/users/:id/:movieTitle', (req, res) => {
  const { id, movieTitle } = req.params;
  let user = users.find( user => user.id == id);

  if (user) {
    user.favoriteMovie = user.favoriteMovie.filter( title => title !== movieTitle);
    // res.status(200).json(user);
    res.status(200).send(`${movieTitle} has been removed from user ${id}'s list`);
  } else {
    res.status(400).send('no this user')
  }
});
// DELETE a user
app.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  let user = users.find( user => user.id == id);

  if (user) {
    // everyUser is a lambda paramater, it could be change the name if it keep the structure A => A.id != id
    users = users.filter( everyUser => everyUser.id != id);
    // res.status(200).json(users);
    res.status(200).send(`user ${id} has been removed from users list`);
  } else {
    res.status(400).send('no this user')
  }
});

// READ all movie list
app.get('/movies', (req, res) => {
  res.status(200).json(movies);
});
// READ movie's information by title
app.get('/movies/:title', (req, res) => {
  const { title } = req.params;
  const movie = movies.find( movie => movie.title === title);

  if (movie) {
    res.status(200).json(movie);
  } else {
    res.status(400).send('We cannot find this movie!');
  }
});
//READ genre by its name
app.get('/genre/:genreName', (req, res) => {
  fs.readFile('genre.json', 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Unable to read movies data');
      return;
    }
    const genres = JSON.parse(data);
    const { genreName } = req.params;
    const genre = genres.find( movie => movie.name === genreName);

    if (genre) {
      res.status(200).json(genre);
    } else {
      res.status(400).send('We cannot find this genre!');
    }
  });
});
// READ diretion's information by its name
app.get('/movies/director/:directorName', (req, res) => {
  const { directorName } = req.params;
  const director = movies.find( movie => movie.director.name === directorName).director;

  if (director) {
    res.status(200).json(director);
  } else {
    res.status(400).send('We cannot find this director!');
  }
});

// basic message to check if the host is running
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});