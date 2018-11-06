'use strict';

import express from 'express';
import passport from 'passport';
import {signToken} from '../auth.service';

var router = express.Router();

router.post('/', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    var error = err || info;
    if(error) {
      console.log("1");
      return res.status(401).json(error);
    }
    if(!user) {
      console.log("2");
      return res.status(404).json({message: 'Something went wrong, please try again.'});
    }
    
    var token = signToken(user._id, user.role, user.createdBy ? 'Customer' : 'Admin');
    console.log("token = " + token);
    res.json({ token });
  })(req, res, next);
});

export default router;
