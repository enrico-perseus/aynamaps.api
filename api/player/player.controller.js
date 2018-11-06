'use strict';

import Player from './player.model';
import PlayerName from '../player_name/player_name.model';
import Group from '../group/group.model';
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
    return Player.find({createdBy: userId}).populate('createdBy group_id').then(function(players) {
      res.status(200).send(players);
    })
    .catch(validationError(res));
}

/**
 * Creates a new language
 */
export function create(req, res) {  

  let playerData = req.body;
  playerData.createdBy = req.user._id;
  let player_name = playerData.player_name;
  playerData.player_name = [];
  let newPlayer = new Player(playerData);
  console.log(playerData);

  async.waterfall([
    function(callback) {
      Player.findOne({player_code: { $regex: playerData.player_code, $options: 'i'}}, function(err, player){
        if (err) callback(err);
        else if(player != null) {
          err = 'The player code already existed.';
          callback(err, null);
        } else {
          callback(null, player);
        }
      });
    },

    function (player, callback) {      
      newPlayer.save(function(err, player){
        if (err) callback(err);
        else callback(null, player);
      });
    },

    function (player, callback){
      console.log('new player data==' + JSON.stringify(newPlayer));
      if (player_name.length > 0){
        for (let i =0; i < player_name.length; i++) {
          player_name[i].player_id = player._id;
        }
        PlayerName.collection.insert(player_name, function(err, result){
          if (err) callback(err);
          else {
            callback(null, player);
          }
        });
      } else {
        callback(null, player);
      }
    },

    function(player, callback) {
      Group.findOne({_id: player.group_id}, function(err, group){
        if (err) callback(err);
        if (group != null){
          callback(null, group, player);
        }
      });
    },

    function(group, player, callback){
      group.usage.push(player._id);
      Group.findOneAndUpdate({_id: group._id}, group, function(err, group){
        if (err) callback(err);
        else callback(null, player);
      })
    }
  ], function(err, result) {
    if (err) return res.status(403).send(err);
    return res.status(200).send(result);
  })  
}
 
export function show(req, res) {

  return Player.findOne({_id: req.params.id}).exec()
    .then(player => {
      if(!player) {
        return res.status(404).end();
      }
      PlayerName.find({player_id: req.params.id/* player_id: player._id *//* { $regex: '.*' + '' + '.*'} */}).exec()
      .then(player_name => {
        if (!player_name){
          return res.status(404).end();
        }
        console.log(player._id + '==========playerNameData=====' + player_name);
        if (player_name){
          player.player_name = player_name;
        }
        console.log('playerData=====' + JSON.stringify(player));
        res.json(player);
      })      
    })
    .catch(validationError(res));
}

export function update(req, res) {
  let playerData = req.body;
  playerData.createdBy = req.user._id;
  let player_name = playerData.player_name;
  playerData.player_name = [];
  let newPlayer = new Player(playerData);
  async.waterfall([
    function(callback){
      Player.findOne({_id: req.body._id}, function(err, player){
        if (err){ 
          callback(err);
        } else {
          callback(null, player);
          
        }        
      });
    },

    function(player, callback){
      Player.findOne({player_code: {$regex: req.body.player_code, $options: 'i'}, createdBy: req.user._id}, function(err, result){
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
    },
    
    function(result, callback){
      Player.findOneAndUpdate({_id: req.body._id}, req.body, function(err, player){
        if (err) callback(err);
        callback(null, player);  
      });
    },
    
    function(player, callback){
      PlayerName.collection.deleteMany({player_id: player._id}, function(err, result){
        if (err) callback(err);
        else {
          callback(null, player);
        }
      });
    },
    
    function (player, callback){
      console.log('new player data==' + JSON.stringify(newPlayer));
      if (player_name.length > 0){
        for (let i =0; i < player_name.length; i++) {
          player_name[i].player_id = player._id;
        }
        PlayerName.collection.insert(player_name, function(err, result){
          if (err) callback(err);
          else {
            callback(null, player);
          }
        });
      } else {
        callback(null, player); 
      }
    }
  ], function(err, player){
    if (err) return res.status(403).send(err);
    return res.status(200).send(player);
  }); 
}

export function destroy(req, res) {
  async.waterfall([
    function(callback){
      Player.findOneAndRemove({_id: req.params.id}, function(err, result){
        if (err) callback(err);
        else callback(null, 'success');
      });
    },

    function(result, callback){
      console.log("player_id =======" + req.params.id);
      PlayerName.collection.deleteMany({player_id: req.params.id}, function(err, result){
        if (err) callback(err);
        else {
          callback(null, 'success');
        }
      });
    }
  ], function(err, result){
    if (err) callback(err);
    return res.status(204).end();
  })

  /* return Player.findOneAndRemove({_id: req.params.id}).exec()
    .then(function() {
      res.status(204).end();
    })
    .catch(handleError(res)); */
}