'use strict';

import Building from './building.model';
import Timeslot from '../timeslot/timeslot.model';
import config from '../../config/environment';

import * as Fn from '../../components/shared/functions';

const async = require('async');
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
  return Building.find({}, '-salt -password').exec()
    .then(buildings => {
      res.status(200).json(buildings);
    })
    .catch(handleError(res));
}

export function me(req, res) {
  var userId = req.user._id;
    return Building.find({createdBy: userId}).populate('createdBy').then(function(buildings) {
      res.status(200).send(buildings);
    })
    .catch(validationError(res));
}

/**
 * Creates a new language
 */
export function create(req, res) {  

  let buildingData = req.body;
  buildingData.createdBy = req.user._id;
  let newBuilding = new Building(buildingData);
  console.log(buildingData);

  async.waterfall([
    function(callback){
      Building.findOne({building_id: {$regex: buildingData.building_id, $options: 'i'}, createdBy: req.user._id}, function(err, building){
        if (err) callback(err);
        if (building != null) {
          err = 'The building id already existed.';
          callback(err, null);
        } else {
          callback(null, 'success');
        }
      });
    },

    function(result,callback){
      Timeslot.findOneAndUpdate({name: buildingData.opening_hours, createdBy: req.user._id}, {$inc: {"usage.use_number": 1}}, function(err, result){
        if (err) callback(err);
        callback(null, 'success');
      });
    },

    function(result,callback){
      Timeslot.findOneAndUpdate({name: buildingData.validity, createdBy: req.user._id}, {$inc: {"usage.use_number": 1}}, function(err, result){
        if (err) callback(err);
        callback(null, 'success');
      });
    },

    function(result, callback){
      newBuilding.save(function(err, building){
        if(err) callback(err);
        callback(null, building);
      });
    }], function(err, result){
      if(err) return res.status(403).send(err);
      return res.status(200).send(result);
    });
}
 
export function show(req, res, next) {

  return Building.findOne({_id: req.params.id}).exec()
    .then(building => {
      if(!building) {
        return res.status(404).end();
      }
      res.json(building);
    })
    .catch(err => next(err));
}

export function update(req, res) {
  async.waterfall([
    function(callback){
      Building.findOne({building_id: {$regex: req.body.building_id, $options: 'i'}, createdBy: req.user._id}, function(err, building){
        if (err){ 
          callback(err);
        }
        
        if (building != null && building._id != req.body._id) {
          err = 'The building id already existed.';
          callback(err, null);
        } else {
          callback(null, building);
        }
      });
    },
    function(building, callback){
      Timeslot.findOneAndUpdate({name: building.opening_hours, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, timeslot){
        if (err) callback(err);
        callback(null, building);
      });
    },

    function(building, callback){
      Timeslot.findOneAndUpdate({name: building.validity, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, timeslot){
        if (err) callback(err);
        callback(null, 'success');
      });
    },
  
    function(result,callback){
      Timeslot.findOneAndUpdate({name: req.body.opening_hours, createdBy: req.user._id}, {$inc: {"usage.use_number": 1}}, function(err, result){
        if (err) callback(err);
        callback(null, 'success');
      });
    },

    function(result,callback){
      Timeslot.findOneAndUpdate({name: req.body.validity, createdBy: req.user._id}, {$inc: {"usage.use_number": 1}}, function(err, result){
        if (err) callback(err);
        callback(null, 'success');
      });
    },

    function(result, callback){
      Building.findOneAndUpdate({_id: req.body._id}, req.body, function(err, building){
        if (err) callback(err);
        callback(null, building);  
      });
    }    
  ], function(err, building){
    if (err) return res.status(403).send(err);
    return res.status(200).send(building);
  });
}

export function destroy(req, res) {

  async.waterfall([
    function(callback){
      Building.findOne({_id: req.params.id}, function(err, building){
        if (err) callback(err);
        callback(null, building);
      });
    },

    function(building, callback){
      Timeslot.findOneAndUpdate({name: building.opening_hours, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, timeslot){
        if (err) callback(err);
        callback(null, building);
      });
    },

    function(building, callback){
      Timeslot.findOneAndUpdate({name: building.validity, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, timeslot){
        if (err) callback(err);
        callback(null, 'success');
      });
    },

    function(result, callback){
      Building.findOneAndRemove({_id: req.params.id}, function(err, result){
        if (err) callback(err);
        callback(null, 'success');
      });
    }
  ], function(err, callback){
    if(err) callback(err);
    return res.status(204).end();
  });  
}