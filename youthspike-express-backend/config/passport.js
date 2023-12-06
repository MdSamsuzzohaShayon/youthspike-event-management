const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

module.exports = (passport) => {
    // console.log("Pasport js ");

    passport.use(new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password'
        },
        function (email, password, done) {
            Admin.findOne({ email }, function (err, admin) {
                // console.log(admin);
                if (err) { return done(err); }
                if (!admin) {
                    return done(null, false, { message: 'Incorrect username.' });
                }
                // if (!user.validPassword(password)) {
                //     return done(null, false, { message: 'Incorrect password.' });
                // }
                // console.log(password);
                // console.log(admin.password);
                bcrypt.compare(password, admin.password, function (err, isMatch) {
                    // console.log("Password match - " ,isMatch);
                    if (isMatch) {
                        return done(null, admin);
                    } else {
                        return done(null, false);
                    }
                });
            });
        }
    ));
    passport.serializeUser(function (user, done) {
        done(null, user._id);
    });

    passport.deserializeUser(function (id, done) {
        Admin.findById(id, function (err, user) {
            // const userInformation = {
            //     name: user.username,
            //     email: user
            // };

            // console.log("User detail - ", user);
            done(err, user);
        });
    });
}


