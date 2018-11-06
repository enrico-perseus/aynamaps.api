'use strict';

import Group from './group.model';
import Player from '../player/player.model';
import config from '../../config/environment';

import * as Fn from '../../components/shared/functions';

var path = require('path');

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
  return Group.find({}, '-salt -password').exec()
    .then(group => {
      res.status(200).json(group);
    })
    .catch(handleError(res));
}

export function me(req, res) {
  var userId = req.user._id;
    return Group.find({createdBy: userId}).populate('createdBy usage').then(function(groups) {

      res.status(200).send(groups);
    })
    .catch(validationError(res));
}

/**
 * Creates a new language
 */
export function create(req, res) {  

  let groupData = req.body;
  groupData.createdBy = req.user._id;
  let newGroup = new Group(groupData);
  console.log(groupData);
  //{short_name: {$regex: req.body.short_name, $options: 'i'}
  return Group.findOne({group_name: {$regex: groupData.group_name, $options: 'i'}, createdBy: req.user._id}).exec()
    .then(group => {            
      
      if (group != null) {
        return res.status(403).send('The group name already existed.');
      }

      return newGroup.save().then(function(group) {
        res.status(200).send(group);
      })
      .catch(validationError(res));
    })
    .catch(validationError(res));
}
 
export function show(req, res, next) {

  return Language.findOne({_id: req.params.id}).exec()
    .then(language => {
      if(!language) {
        return res.status(404).end();
      }
      res.json(language);
    })
    .catch(err => next(err));
}

export function update(req, res) {
  console.log("update");
  return Group.findOne({group_name: {$regex: req.body.group_name, options: 'i'}, createdBy: req.user._id}).exec()
    .then(group => {
      if (group != null && group._id != req.body._id) {
        return res.status(403).send('The group name already existed.');
      }

      Group.findOneAndUpdate({_id: req.body._id}, req.body).exec()
          .then(group => {
            return res.json(group);
          })
          .catch(validationError(res));
    })
    .catch(validationError(res));
}

export function destroy(req, res) {
  return Group.findOneAndRemove({_id: req.params.id}).exec()
    .then(function() {
      res.status(204).end();
    })
    .catch(handleError(res));
}