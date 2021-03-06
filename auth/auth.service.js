'use strict';
import config from '../config/environment';
import jwt from 'jsonwebtoken';
import expressJwt from 'express-jwt';
import compose from 'composable-middleware';
import User from '../api/user/user.model';
import Customer from '../api/customer/customer.model';

var validateJwt = expressJwt({
  secret: config.secrets.session,
  getToken: function fromHeaderOrQuerystring (req) {
    console.log('*********okay********');
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      return req.query.token;
    }
    return null;
  }
});

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */
export function isAuthenticated() {
  return compose()
        // Validate jwt
        .use(function(req, res, next) {
            // allow access_token to be passed through query parameter as well
          if(req.query && req.query.hasOwnProperty('access_token')) {
            req.headers.authorization = `Bearer  ${req.query.access_token}`;
          }
            // IE11 forgets to set Authorization header sometimes. Pull from cookie instead.
          if(req.query && typeof req.headers.authorization === 'undefined') {
            req.headers.authorization = `Bearer  ${req.cookies.token}`;
          }
          validateJwt(req, res, next);
        })
        // Attach user to request
        .use(function(req, res, next) {
          if (req.user.userType == 'Admin') {
            User.findById(req.user._id).exec()
              .then(user => {
                if(!user) {
                  return res.status(401).end();
                }
                req.user = user;
                req.user.userType = 'Admin';
                next();
                return null;
              })
              .catch(err => next(err));
          } else {
            Customer.findById(req.user._id).exec()
              .then(user => {
                if(!user){
                  return res.status(401).end();
                }
                req.user = user;
                req.user.userType = 'Customer';
                next();
                return null;
              })
              .catch(err => next(err));
          }
        });
}

/**
 * Checks if the user role meets the minimum requirements of the route
 */
export function hasRole(roleRequired, userType) {
  if(!roleRequired) {
    throw new Error('Required role needs to be set');
  }

  return compose()
        .use(isAuthenticated())
        .use(function meetsRequirements(req, res, next) {
          if(userType !== '*' && req.user.userType !== userType) {
            return res.status(403).send('Forbidden');
          }
          console.log("hasrole = " + config.userRoles)
          if(config.userRoles.indexOf(req.user.role) >= config.userRoles.indexOf(roleRequired)) {
            return next();
          } else {
            return res.status(403).send('Forbidden');
          }
        });
}

/**
 * Returns a jwt token signed by the app secret
 */
export function signToken(id, role, userType) {
  return jwt.sign({ _id: id, role, userType }, config.secrets.session, {
    expiresIn: config.secrets.expiredIn
  });
}

/**
 * Set token cookie directly for oAuth strategies
 */
export function setTokenCookie(req, res) {
  if(!req.user) {
    return res.status(404).send('It looks like you aren\'t logged in, please try again.');
  }
  var token = signToken(req.user._id, req.user.role);
  res.cookie('token', token);
  res.redirect('/');
}
