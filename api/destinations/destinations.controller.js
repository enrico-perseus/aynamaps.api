'use strict';

import Destination from './destinations.model'
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
  return Destination.find({}, '-salt -password').exec()
    .then(destinations => {
      res.status(200).json(destinations);
    })
    .catch(handleError(res));
}

export function getTopList(req, res) {
  console.log('input node api getTopList');
  var mysort = { createdAt: -1 };
  return Destination.find({}, '-salt -password').sort(mysort).limit(5).exec()
    .then(destinations => {
      res.status(200).json(destinations);
    })
    .catch(handleError(res));
}

export function getBottomList(req, res) {
  console.log('input node api getBottomList');
  var mysort = { ceatedAt: 1 };
  return Destination.find({}, '-salt -password').sort(mysort).limit(5).exec()
    .then(destinations => {
      res.status(200).json(destinations);
    })
    .catch(handleError(res));
}

export function me(req, res) {
  var userId = req.user._id;
    return Destination.find({createdBy: userId}).populate('createdBy category').then(function(destinations) {
      res.status(200).send(destinations);
    })
    .catch(validationError(res));
}

/**
 * Creates a new destination
 */
export function create(req, res) {  
  let destinationData = req.body;
  destinationData.createdBy = req.user._id;
  let newDestination = new Destination(destinationData);

  async.waterfall([
    function(callback){
      Destination.findOne({destination_code: {$regex: destinationData.destination_code, $options: 'i'}, building_id: destinationData.building_id, createdBy: req.user._id}, function(err, destination){
        if (err) {
          callback(err);
        } else {
        if (destination != null) {
          err = 'The destination code already existed.';
          callback(err, null);
        } else {
          callback(null, 'success');
        }
        }
      });
    },

    function(result, callback){
      Timeslot.findOneAndUpdate({name: destinationData.opening_hours, createdBy: req.user._id}, {$inc: {"usage.use_number": 1}}, function(err, result){
        if (err) callback(err);
        else callback(null, 'success');
      });
    },

    function(result, callback){
      Timeslot.findOneAndUpdate({name: destinationData.validity, createdBy: req.user._id}, {$inc: {"usage.use_number": 1}}, function(err, result){
        if (err) callback(err);
        else callback(null, 'success');
      });
    },

    function(result, callback){
      Category.findOneAndUpdate({_id: destinationData.category, createdBy: req.user._id}, {$inc: {"usage.use_number": 1}}, function(err, result){
        if (err) callback(err);
        else callback(null, 'success');
      });
    },

    function(result, callback){
      newDestination.save(function(err, destination){
        if(err) callback(err);
        else callback(null, destination);
      });
    }
  ], function(err, result){
    if (err) return res.status(403).send(err);
    return res.status(200).send(result);
  });
}
 
export function show(req, res, next) {

  return Destination.findOne({_id: req.params.id}).exec()
    .then(destination => {
      if(!destination) {
        return res.status(404).end();
      }
      res.json(destination);
    })
    .catch(err => next(err));
}

export function update(req, res) {
  console.log("update");

  async.waterfall([
    function(callback){
      Destination.findOne({_id: req.body._id}, function(err, destination){
        if (err){ 
          callback(err);
        } else {
          callback(null, destination);
          
        }        
      });
    },

    function(destination, callback){
      Destination.findOne({destination_code: {$regex: req.body.destination_code, $options: 'i'}, building_id: destination.building_id, createdBy: req.user._id}, function(err, result){
        if (err) callback(err);
        else if (result != null && result._id != req.body._id) {
            err = 'The destination code already existed.';
            callback(err, null);
        } else {
            callback(null, destination);
        }        
      });
    },
    function(destination, callback){
      Timeslot.findOneAndUpdate({name: destination.opening_hours, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, timeslot){
        if (err) callback(err);
        else callback(null, destination);
      });
    },

    function(destination, callback){
      Timeslot.findOneAndUpdate({name: destination.validity, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, timeslot){
        if (err) callback(err);
        else callback(null, destination);
      });
    },

    function(destination, callback){
      Category.findOneAndUpdate({_id: destination.category, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, category) {
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
      Category.findOneAndUpdate({_id: req.body.category, createdBy: req.user._id}, {$inc: {"usage.use_number": 1}}, function(err, result) {
        if (err) callback(err);
        else callback(null, 'success');
      });
    },

    function(result, callback){
      Destination.findOneAndUpdate({_id: req.body._id}, req.body, function(err, destination){
        if (err) callback(err);
        callback(null, destination);  
      });
    }    
  ], function(err, destination){
    if (err) return res.status(403).send(err);
    return res.status(200).send(destination);
  });
}

export function destroy(req, res) {

  async.waterfall([
    function(callback){
      Destination.findOne({_id: req.params.id}, function(err, destination){
        if (err) {
          callback(err);
        } else {
          callback(null, destination);
        }
      });
    },

    function(destination, callback){
      Timeslot.findOneAndUpdate({name: destination.opening_hours, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, timeslot){
        if (err) callback(err); else callback(null, destination);
      });
    },

    function(destination, callback){
      Timeslot.findOneAndUpdate({name: destination.validity, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, timeslot){
        if (err) callback(err); else callback(null, destination);
      });
    },

    function(destination, callback){
      Category.findOneAndUpdate({_id: destination.category, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, category){
        if (err) callback(err); else callback(null, 'success');
      });
    },

    function(result, callback){
      Destination.findOneAndRemove({_id: req.params.id}, function(err, result){
        if (err) callback(err); else callback(null, 'success');
      });
    }
  ], function(err, callback){
    if(err) calback(err);
    return res.status(204).end();
  });
}