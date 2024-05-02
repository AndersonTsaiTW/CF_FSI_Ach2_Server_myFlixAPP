const passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    Models = require('./model.js'),
    passportJWT = require('passport-jwt');

let Users = Models.User,
    JWTStrategy = passportJWT.Strategy,
    ExtractJWT = passportJWT.ExtractJwt;

passport.use(
    new LocalStrategy(
        {
            usernameField: 'Username',
            passwordField: 'Password',
        },
        async (username, password, callback) => {
            console.log(`${username} ${password}`);
            await Users.findOne({Username: username})
            .then((user) => {
                if (!user) {
                    console.log('incorrect username');
                    return callback(null, false, 
                        {message: 'Incorrect username or password.'}
                    );
                }
                console.log('finished');
                return callback(null, user);
            })
            .catch((error) => {
                    console.log(error);
                    return callback(error);
            })
        }
    )
);

passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'your_jwt_secret'
}, async (jwtPayload, callback) => {
    return await Users.findById(jwtPayload.id)
    .then((user) => {
        return callback(null, user);
    })
    .catch((error) => {
        console.log('JWTToken is not correct.')
        return callback(error);
    });
}));