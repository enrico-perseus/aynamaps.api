'use strict';

import Role from './role.model'
import UsersInfo from '../users_info/users_info.model';
import config from '../../config/environment';

import * as Fn from '../../components/shared/functions';

var path = require('path');
var fs = require('fs');

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

export function index(req, res) {
  return Role.find({}, /*{createdBy: req.user._id},*/ '-salt -password').exec()
    .then(roles => {
      console.log(roles);
      res.status(200).json(roles);
    })
    .catch(handleError(res));
}

export function me(req, res) {
  var userId = req.user._id;
    return Role.find({createdBy: userId}).populate('createdBy').then(function(roles) {
      res.status(200).json(roles);
    })
    .catch(validationError(res));
}
/**
 * Creates a new user
 */
export function create(req, res) {  

  let roleData = req.body;
  roleData.createdBy = req.user._id;
  let newRole = new Role(roleData);
  console.log("roleData=======" + roleData);

  return Role.findOne({"role_name": {$regex: roleData.role_name, $options: 'i'}, createdBy: req.user._id}).exec()
    .then(role => {            
      
      if (role != null) {
        return res.status(403).send('The role name already existed.');
      }

      return newRole.save().then(function(role) {
        res.status(200).send(role);
      })
      .catch(validationError(res));
    })
    .catch(validationError(res));
}

export function show(req, res, next) {

  return Role.findOne({_id: req.params.id, createdBy: req.user._id}).exec()
    .then(role => {
      if(!role) {
        return res.status(404).end();
      }
      res.json(role);
      console.log(role);
      //res.status(200).send(timeslot);
    })
    .catch(err => next(err));
}

export function update(req, res) {
  console.log("enter role update api");
  return Role.findOne({role_name: {$regex: req.body.role_name, $options: 'i'}, createdBy: req.user._id}).exec()
    .then(role => {
      if (role != null && role._id != req.body._id) {
        return res.status(403).send('The specified name is already in use.');
      }
          Role.findOneAndUpdate({_id: req.body._id}, req.body).exec()
          .then(role => {
            return res.json(role);
          })
          .catch(validationError(res));
    })
    .catch(validationError(res));
}

export function findUsingbyName(req, res) {
  var positions = [];
  var role_name = req.params.name;
  console.log("role_name=========" + role_name);
  return UsersInfo.find({role: role_name, createdBy: req.user._id}, {name: 1}).exec()
    .then(function(users_info) {
      var result = {type: 'Users', position_name:'name', position: users_info, route: 'users'}
      if (users_info.length > 0) positions.push(result);
      res.status(200).json(positions);
    })
    .catch(validationError(res));
}

export function destroy(req, res) {
  return Role.findOneAndRemove({_id: req.params.id}).exec()
    .then(function() {
      res.status(204).end();
    })
    .catch(handleError(res));
}