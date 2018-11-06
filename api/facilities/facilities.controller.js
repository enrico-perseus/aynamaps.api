'use strict';

import Facility from './facilities.model';
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
  return Facility.find({}, '-salt -password').exec()
    .then(facilities => {
      res.status(200).json(facilities);
    })
    .catch(handleError(res));
}

export function me(req, res) {
  var userId = req.user._id;
    return Facility.find({createdBy: userId}).populate('createdBy category').then(function(facilities) {
      res.status(200).send(facilities);
    })
    .catch(validationError(res));
}

/**
 * Creates a new language
 */
export function create(req, res) {  

  let facilityData = req.body;
  facilityData.createdBy = req.user._id;
  let newFacility = new Facility(facilityData);
  console.log(facilityData);

  async.waterfall([
    function(callback){
      Facility.findOne({facility_code: {$regex: facilityData.facility_code, $options: 'i'}, building_id: facilityData.building_id, createdBy: req.user._id}, function(err, facility){
        if (err) {
          callback(err);
        } else {
          if (facility != null) {
            err = 'The facility code already existed.';
            callback(err, null);
          } else {
            callback(null, 'success');
          }
        }
      });
    },

    function(result, callback){
      Timeslot.findOneAndUpdate({name: facilityData.opening_hours, createdBy: req.user._id}, {$inc: {"usage.use_number": 1}}, function(err, result){
        if (err) callback(err); else callback(null, 'success');
      });
    },

    function(result, callback){
      Timeslot.findOneAndUpdate({name: facilityData.validity, createdBy: req.user._id}, {$inc: {"usage.use_number": 1}}, function(err, result){
        if (err) callback(err); else callback(null, 'success');
      });
    },

    function(result, callback){
      Category.findOneAndUpdate({_id: facilityData.category, createdBy: req.user._id}, {$inc: {"usage.use_number": 1}}, function(err, result){
        if (err) callback(err); else callback(null, 'success');
      });
    },

    function(result, callback){
      newFacility.save(function(err, facility){
        if(err) callback(err);
        console.log(facility);
        callback(null, facility);
      });
    }
  ], function(err, result){
    if (err) return res.status(403).send(err);
    return res.status(200).send(result);
  });
}
 
export function show(req, res, next) {

  return Facility.findOne({_id: req.params.id}).exec()
    .then(facility => {
      if(!facility) {
        return res.status(404).end();
      }
      res.json(facility);
    })
    .catch(err => next(err));
}

export function update(req, res) {
  async.waterfall([
    function(callback){
      Facility.findOne({_id: req.body._id}, function(err, facility){
        if (err){ 
          callback(err);
        } else {
          callback(null, facility);
          
        }        
      });
    },

    function(facility, callback){
      Facility.findOne({facility_code: {$regex: req.body.facility_code, $options: 'i'}, building_id: facility.building_id, createdBy: req.user._id}, function(err, result){
        if (err){ 
          callback(err);
        }
        
        if (result != null && result._id != req.body._id) {
          err = 'The facility code already existed.';
          callback(err, null);
        } else {
          callback(null, facility);
        }
      });
    },
    function(facility, callback){
      Timeslot.findOneAndUpdate({name: facility.opening_hours, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, timeslot){
        if (err) callback(err); else callback(null, facility);
      });
    },

    function(facility, callback){
      Timeslot.findOneAndUpdate({name: facility.validity, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, timeslot){
        if (err) callback(err); else callback(null, facility);
      });
    },

    function(facility, callback){
      Category.findOneAndUpdate({_id: facility.category, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, result){
        if (err) callback(err); else callback(null, 'success');
      });
    },
  
    function(result,callback){
      Timeslot.findOneAndUpdate({name: req.body.opening_hours, createdBy: req.user._id}, {$inc: {"usage.use_number": 1}}, function(err, result){
        if (err) callback(err); else callback(null, 'success');
      });
    },

    function(result,callback){
      Timeslot.findOneAndUpdate({name: req.body.validity, createdBy: req.user._id}, {$inc: {"usage.use_number": 1}}, function(err, result){
        if (err) callback(err); else callback(null, 'success');
      });
    },

    function(result, callback){
      Category.findOneAndUpdate({_id: req.body.category, createdBy: req.user._id}, {$inc: {"usage.use_number": 1}}, function(err, result){
        if (err) callback(err); else callback(null, 'success');
      });
    },

    function(result, callback){
      Facility.findOneAndUpdate({_id: req.body._id}, req.body, function(err, facility){
        if (err) callback(err); else callback(null, facility);  
      });
    }    
  ], function(err, facility){
    if (err) return res.status(403).send(err);
    return res.status(200).send(facility);
  });
}

export function destroy(req, res) {
  async.waterfall([
    function(callback){
      Facility.findOne({_id: req.params.id}, function(err, facility){
        if (err) {
          callback(err);
        } else {
          callback(null, facility);
        }
      });
    },

    function(facility, callback){
      Timeslot.findOneAndUpdate({name: facility.opening_hours, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, timeslot){
        if (err) callback(err); else callback(null, facility);
      });
    },

    function(facility, callback){
      Timeslot.findOneAndUpdate({name: facility.validity, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, timeslot){
        if (err) callback(err); else callback(null, facility);
      });
    },

    function(facility, callback){
      Category.findOneAndUpdate({_id: facility.category, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, category){
        if (err) callback(err); else callback(null, 'success');
      })
    },

    function(result, callback){
      Facility.findOneAndRemove({_id: req.params.id}, function(err, result){
        if (err) callback(err); else callback(null, 'success');
      });
    }
  ], function(err, callback){
    if(err) calback(err);
    return res.status(204).end();
  });
}