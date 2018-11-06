import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';

function localAuthenticate(User, Customer, email, password, done) {
  User.findOne({
    email: email.toLowerCase()
  }).exec()
        .then(user => {
          if(!user) {
            Customer.findOne({
              email: email.toLowerCase()
            }).exec()
              .then(user => {
                console.log("authenticate = " + email.toLowerCase());
                if(!user) {
                  return done(null, false, {
                    message: 'This email is not registered.'
                  });
                }
                user.authenticate(password, function (authError, authenticated) {
                  console.log("authError = " + authError);
                  console.log("authenticated = " + authenticated);
                  if(authError) {
                    return done(authError);
                  }
                  if(!authenticated) {
                    return done(null, false, { message: 'This password is not correct.' });
                  } else {
                    return done(null, user);  
                  }
                })
              })
              .catch(err => done(err));
          } else {
            user.authenticate(password, function(authError, authenticated) {
              if(authError) {
                return done(authError);
              }
              if(!authenticated) {
                return done(null, false, { message: 'This password is not correct.' });
              } else {
                return done(null, user);
              }
            });
          }
        })
        .catch(err => done(err));
}

export function setup(User, Customer/*, config*/) {
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password' // this is the virtual field on the model
  }, function(email, password, done) {
    return localAuthenticate(User, Customer, email, password, done);
  }));
}
