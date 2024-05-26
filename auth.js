const jwtSecret = 'your_jwt_secret'; // need to be the same with the JWTStrategy set
const jwt = require('jsonwebtoken'),
    passport = require('passport');

require('./passport'); // the passport.js we just created

let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
        subject: user.Username, // the username we encoding in the JWT
        expiresIn: '7d', // use 7 days only
        algorithm: 'HS256' // the algorithm used to 'sign' the value of the JWT
    });
}

// POST login.
module.exports = (router) => {
    router.post('/login', (req,res) => {
        // use local to check the username and password are equal to dadabase
        passport.authenticate('local', { session: false}, 
    (error, user, info) => {
        // if some errors happen when authenticate
        if (error || !user) {
            return res.status(400).json({
                message: 'Something is not right',
                user: user
            });
        }
        req.login(user, { session: false }, (error) =>
    {
        // if some errors happen when login
        if (error) {
            res.send(error);
        }
        // no error => generate token and return
        let token = generateJWTToken(user.toJSON());
        // shorthand of "res.json({ user: user, token: token })"
        return res.json({ user, token });
    });
})(req, res);
});
}