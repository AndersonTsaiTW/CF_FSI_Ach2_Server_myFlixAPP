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
                        {message: 'Incorrect username.'}
                    );
                }
                if (!user.validatePassword(password)) {
                    console.log('incorrect password');
                    return callback(null, false, 
                        {message: 'Incorrect password.'}
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

//// the code below is from chatGPT that adjust from the code in the bottom of this doc
passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'your_jwt_secret'
}, async (jwtPayload, callback) => {
    try {
        // Here is only check the user is in the user list
        // but doesn't check who is the specific user or not
        const user = await Users.findById(jwtPayload._id);
        if (!user) {
            //// the code below use to check the jwtPayload's structure 
            // console.log(jwtPayload);
            throw new Error('User not found');
        }
        console.log(jwtPayload.Username + `'s token has been accepted.`);
        return callback(null, user);
    } catch (error) {
        console.log('JWTToken is not correct.');
        return callback(error);
    }
}));

//// the original code from CareerFoundry
// passport.use(new JWTStrategy({
//     jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
//     secretOrKey: 'your_jwt_secret'
// }, async (jwtPayload, callback) => {
//     return await Users.findById(jwtPayload.id)
//     .then((user) => {
//         return callback(null, user);
//     })
//     .catch((error) => {
//         console.log('JWTToken is not correct.');
//         return callback(error);
//     });
// }));