'use strict';

import UsersInfo from './users_info.model'
import config from '../../config/environment';

import * as Fn from '../../components/shared/functions';

var path = require('path');
var fs = require('fs');

function generatePassword() {
  function s5() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s5() + s5();
}

function validationError(res, statusCode) {
  console.log("error = " + res);
  statusCode = statusCode || 422;
  return function(err) {
    return res.status(statusCode).json(err);
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    return res.status(statusCode).send(err);
  };
}

export function upload(req, res) {  
  require('crypto').randomBytes(48, function (err, buffer) {
    var uniqueName = buffer.toString('hex').substr(0, 8);

    var newPath = path.resolve('./assets/uploads/' + uniqueName + path.extname(req.files.file.name)),
    relativePath= 'assets/uploads/' + uniqueName + path.extname(req.files.file.name);
    
    let file = req.files.file;
    file.mv(newPath, function (err) {
      if (err) {
        return res.status(500).send(err);
      }

      res.send(relativePath);
    })
  });
}

export function index(req, res) {
  return UsersInfo.find({}, /*{createdBy: req.user._id},*/ '-salt -password').exec()
    .then(users_info => {
      console.log(users_info);
      res.status(200).json(users_info);
    })
    .catch(handleError(res));
}

export function me(req, res) {
  var userId = req.user._id;
    return UsersInfo.find({createdBy: userId}).populate('createdBy').then(function(users_info) {
      res.status(200).json(users_info);
    })
    .catch(validationError(res));
}
/**
 * Creates a new user
 */
export function create(req, res) {  

  let users_info = req.body;
  let password = 'aaaaaa';//generatePassword();
  users_info.password = password;
  users_info.createdBy = req.user._id;
  let newUsersInfo = new UsersInfo(users_info);
  console.log("users_info=======" + config.siteUrl);

  return UsersInfo.findOne({email: users_info.email, createdBy: req.user._id}).exec()
    .then(user => {            
      
      if (user != null) {
        return res.status(403).send('The email already existed.');
      }

      newUsersInfo.save().then(function(user) {
        var mailOptions = {
          from: config.adminMailAddress,
          to: user.email,
          subject: 'Account Registration | Ayna',
          html: '<h3>Hi ' + req.body.name + ',</h3><h4>Your account on Ayna Has been Registered successfully</h4>Here Is your Temporary Password :' + password +
          '<br/>Use temporary password to login .<a href="' + config.siteUrl + '/auth/login">Click Here to Login</a>.'
      };
      Fn.send_mail(mailOptions, function (err, info) {
        if(err) {
          res.status(200).send({
            message: 'Created a user successfully. However fail on send mail to customer.',
            err: err
          });
        } else {
          res.status(200).send({
            message: 'Created a user and send mail, successfully.',
            err: null
          });
        }
      });      
      })
      .catch(validationError(res));
    })
    .catch(validationError(res));
}

export function show(req, res, next) {

  return UsersInfo.findOne({_id: req.params.id, createdBy: req.user._id}).exec()
    .then(users_info => {
      if(!users_info) {
        return res.status(404).end();
      }
      res.json(users_info);
      console.log(users_info);
      //res.status(200).send(timeslot);
    })
    .catch(err => next(err));
}

export function update(req, res) {
  console.log("enter user update api");
  return UsersInfo.findOne({email: req.body.email, createdBy: req.user._id}).exec()
    .then(users_info => {
      if (users_info != null && users_info._id != req.body._id) {
        return res.status(403).send('The email is already in use.');
      }
          UsersInfo.findOneAndUpdate({_id: req.body._id}, req.body).exec()
          .then(users_info => {
            return res.json(users_info);
          })
          .catch(validationError(res));
      })
    .catch(validationError(res));
}

export function destroy(req, res) {
  return UsersInfo.findOneAndRemove({_id: req.params.id}).exec()
    .then(function() {
      res.status(204).end();
    })
    .catch(handleError(res));
}