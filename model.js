const mongoose = require('mongoose');
let movieSchema = mongoose.schema({
    Title: {type: String, required: true},
    Description: {type: String, required: true},
    Genre: {
        Name: String,
        Description: String
    },
    Directors: {
        Name: String,
        Bio: String
    },
    Actors: [String],
    ImgPath: String,
    Featured: Boolean
});

let userSchema = mongoose.schema({
    Username: {type: String, required: true},
    Password: {type: String, required: true},
    Email: {type:String, required: true},
    Birthday: Date,
    FavoriateMovie: [{type: mongoose.Schema.type.ObjectID, ref: 'Movie'}]
});

let Movie = mongoose.model('Movie',movieSchema);
let User = mongoose.model('User',userSchema);

module.exports.Movie = Movie;
module.exports.User = User;
