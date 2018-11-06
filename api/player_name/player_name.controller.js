'use strict';

import PlayerName from './player_name.model'
import config from '../../config/environment';

import * as Fn from '../../components/shared/functions';

const async  = require('async');
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
  return Language.find({}, '-salt -password').exec()
    .then(languages => {
      res.status(200).json(languages);
    })
    .catch(handleError(res));
}

export function me(req, res) {
  var userId = req.user._id;
    return PlayerName.find({createdBy: userId}).populate('createdBy group_id').then(function(players_name) {
      res.status(200).send(players_name);
    })
    .catch(validationError(res));
}

/**
 * Creates a new language
 */
export function create(req, res) {  

  let playerNameData = req.body;
  playerNameData.createdBy = req.user._id;
  let newPlayerName = new Player(playerNameData);
  console.log(playerData);

  return PlayerName.findOne({player_code: { $regex: playerNameData.player_code, $options: 'i'}}).exec()
    .then(player => {            
      
      if (player != null) {
        return res.status(403).send('The player code already existed.');
      }

      return newPlayerName.save().then(function(playerName) {
        res.status(200).send(playerName);
      })
      .catch(validationError(res));
    })
    .catch(validationError(res));
}
 
export function show(req, res, next) {

  return PlayerName.findOne({_id: req.params.id}).exec()
    .then(playerName => {
      if(!playerName) {
        return res.status(404).end();
      }
      res.json(playerName);
    })
    .catch(err => next(err));
}

export function update(req, res) {
  console.log("update");
  
  async.waterfall([
    function(callback){
      PlayerName.findOne({_id: req.body._id}, function(err, playerName){
        if (err){ 
          callback(err);
        } else {
          callback(null, playerName);
          
        }        
      });
    },

    /* function(playerName, callback){
      PlayerName.findOne({player_code: {$regex: req.body.player_code, $options: 'i'}, createdBy: req.user._id}, function(err, result){
        if (err){ 
          callback(err);
        }
        
        if (result != null && result._id != req.body._id) {
          err = 'The player code already existed.';
          callback(err, null);
        } else {
          callback(null, 'success');
        }
      });
    }, */
    
    function(result, callback){
      PlayerName.findOneAndUpdate({_id: req.body._id}, req.body, function(err, playerName){
        if (err) callback(err);
        callback(null, playerName);  
      });
    }    
  ], function(err, playerName){
    if (err) return res.status(403).send(err);
    return res.status(200).send(playerName);
  }); 
}

export function destroy(req, res) {
  return PlayerName.findOneAndRemove({_id: req.params.id}).exec()
    .then(function() {
      res.status(204).end();
    })
    .catch(handleError(res));
}