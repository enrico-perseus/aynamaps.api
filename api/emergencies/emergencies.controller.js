'use strict';

import Emergency from './emergencies.model';
import Timeslot from '../timeslot/timeslot.model';
import Category from '../category/category.model';
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
  return Emergency.find({}, '-salt -password').exec()
    .then(emergencies => {
      res.status(200).json(emergencies);
    })
    .catch(handleError(res));
}

export function me(req, res) {
  var userId = req.user._id;
    return Emergency.find({createdBy: userId}).populate('createdBy category').then(function(emergencies) {
      res.status(200).send(emergencies);
    })
    .catch(validationError(res));
}

/**
 * Creates a new language
 */
export function create(req, res) {  

  let emergencyData = req.body;
  emergencyData.createdBy = req.user._id;
  let newEmergency = new Emergency(emergencyData);
  console.log(emergencyData);

  async.waterfall([
    function(callback){
      Emergency.findOne({emergency_code: {$regex: emergencyData.emergency_code, $options: 'i'}, building_id: emergencyData.building_id, createdBy: req.user._id}, function(err, emergency){
        if (err) {
          callback(err);
        } else {
          if (emergency != null) {
            err = 'The emergency code already existed.';
            callback(err, null);
          } else {
            callback(null, 'success');
          }
        }
      });
    },

    function(result, callback){
      Timeslot.findOneAndUpdate({name: emergencyData.opening_hours, createdBy: req.user._id}, {$inc: {"usage.use_number": 1}}, function(err, result){
        if (err) callback(err);
        else callback(null, 'success');
      });
    },

    function(result, callback){
      Timeslot.findOneAndUpdate({name: emergencyData.validity, createdBy: req.user._id}, {$inc: {"usage.use_number": 1}}, function(err, result){
        if (err) callback(err);
        else callback(null, 'success');
      });
    },

    function(result, callback) {
      Category.findOneAndUpdate({_id: emergencyData.category, createdBy: req.user._id}, {$inc: {"usage.use_number": 1}}, function(err, result){
        if (err) callback(err);
        else callback(null, 'success');
      });
    },

    function(result, callback){
      newEmergency.save(function(err, emergency){
        if(err) callback(err);
        else callback(null, emergency);
      });
    }
  ], function(err, result){
    if (err) return res.status(403).send(err);
    return res.status(200).send(result);
  });
}
 
export function show(req, res, next) {

  return Emergency.findOne({_id: req.params.id}).exec()
    .then(emergency => {
      if(!emergency) {
        return res.status(404).end();
      }
      res.json(emergency);
    })
    .catch(err => next(err));
}

export function update(req, res) {

  async.waterfall([
    function(callback){
      Emergency.findOne({_id: req.body._id}, function(err, emergency){
        if (err){ 
          callback(err);
        } else {
          callback(null, emergency);          
        }        
      });
    },

    function(emergency, callback){
      Emergency.findOne({emergency_code: {$regex: req.body.emergency_code, $options: 'i'}, building_id: emergency.building_id, createdBy: req.user._id}, function(err, result){
        if (err){ 
          callback(err);
        }
        
        if (result != null && result._id != req.body._id) {
          err = 'The emergency code already existed.';
          callback(err, null);
        } else {
          callback(null, emergency);
        }
      });
    },
    function(emergency, callback){
      Timeslot.findOneAndUpdate({name: emergency.opening_hours, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, timeslot){
        if (err) callback(err);
        else callback(null, emergency);
      });
    },

    function(emergency, callback){
      Timeslot.findOneAndUpdate({name: emergency.validity, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, timeslot){
        if (err) callback(err);
        else callback(null, emergency);
      });
    },

    function(emergency, callback){
      console.log("category========" + emergency.category);
      Category.findOneAndUpdate({_id: emergency.category, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, category){
        if (err) callback(err);
        else callback(null, 'success'); 
      });
    },
  
    function(result,callback){
      Timeslot.findOneAndUpdate({name: req.body.opening_hours, createdBy: req.user._id}, {$inc: {"usage.use_number": 1}}, function(err, result){
        if (err) callback(err);
        else callback(null, 'success');
      });
    },

    function(result,callback){
      Timeslot.findOneAndUpdate({name: req.body.validity, createdBy: req.user._id}, {$inc: {"usage.use_number": 1}}, function(err, result){
        if (err) callback(err);
        else callback(null, 'success');
      });
    },

    function(result, callback){
      Category.findOneAndUpdate({_id: req.body.category, createdBy: req.user._id}, { $inc: {"usage.use_number": 1}}, function(err, category){
        if (err) callback(err);
        else callback(null, 'success');
      });
    },

    function(result, callback){
      Emergency.findOneAndUpdate({_id: req.body._id}, req.body, function(err, emergency){
        if (err) callback(err);
        callback(null, emergency);  
      });
    }    
  ], function(err, emergency){
    if (err) return res.status(403).send(err);
    return res.status(200).send(emergency);
  });
}

export function destroy(req, res) {

  async.waterfall([
    function(callback){
      Emergency.findOne({_id: req.params.id}, function(err, emergency){
        if (err) callback(err); else callback(null, emergency);
      });
    },

    function(emergency, callback){
      Timeslot.findOneAndUpdate({name: emergency.opening_hours, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, timeslot){
        if (err) callback(err); else callback(null, emergency);
      });
    },

    function(emergency, callback){
      Timeslot.findOneAndUpdate({name: emergency.validity, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, timeslot){
        if (err) callback(err); else callback(null, emergency);
      });
    },

    function(emergency, callback){      
      Category.findOneAndUpdate({_id: emergency.category, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, emergency){
        if (err) callback(err); else callback(null, emergency);
      });
    },

    function(result, callback){
      Emergency.findOneAndRemove({_id: req.params.id}, function(err, result){
        if (err) callback(err); else callback(null, 'success');
      });
    }
  ], function(err, callback){
    if(err) calback(err);
    return res.status(204).end();
  });
}