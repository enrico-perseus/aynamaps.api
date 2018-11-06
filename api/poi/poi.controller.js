'use strict';

import Poi from './poi.model';
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
  return Poi.find({}, '-salt -password').exec()
    .then(pois => {
      res.status(200).json(pois);
    })
    .catch(handleError(res));
}

export function me(req, res) {
  var userId = req.user._id;
    return Poi.find({createdBy: userId}).populate('createdBy category').then(function(pois) {
      res.status(200).send(pois);
    })
    .catch(validationError(res));
}

/**
 * Creates a new Point of Interest
 */
export function create(req, res) {  

  let poiData = req.body;
  poiData.createdBy = req.user._id;
  let newPoi = new Poi(poiData);
  console.log(poiData);

  async.waterfall([
    function(callback){
      Poi.findOne({poi_number: {$regex: poiData.poi_number, $options: 'i'}, building_id: poiData.building_id, createdBy: req.user._id}, function(err, poi){
        if (err) {
          callback(err);
        } else {
          if (poi != null) {
            err = 'The Point of Interest number already existed.';
            callback(err, null);
          } else {
            callback(null, 'success');
          }
        }
      });
    },

    function(result, callback){
      Timeslot.findOneAndUpdate({name: poiData.opening_hours, createdBy: req.user._id}, {$inc: {"usage.use_number": 1}}, function(err, result){
        if (err) callback(err); else callback(null, 'success');
      });
    },

    function(result, callback){
      Timeslot.findOneAndUpdate({name: poiData.validity, createdBy: req.user._id}, {$inc: {"usage.use_number": 1}}, function(err, result){
        if (err) callback(err); else callback(null, 'success');
      });
    },

    function(result, callback){
      Category.findOneAndUpdate({_id: poiData.category, createdBy: req.user._id}, {$inc: {"usage.use_number": 1}}, function(err, result){
        if (err) callback(err); else callback(null, 'success');
      });
    },

    function(result, callback){
      newPoi.save(function(err, poi){
        if(err) callback(err);
        console.log(poi);
        callback(null, poi);
      });
    }
  ], function(err, result){
    if (err) return res.status(403).send(err);
    return res.status(200).send(result);
  });
}
 
export function show(req, res, next) {

  return Poi.findOne({_id: req.params.id}).exec()
    .then(poi => {
      if(!poi) {
        return res.status(404).end();
      }
      res.json(poi);
    })
    .catch(err => next(err));
}

export function update(req, res) {

  async.waterfall([
    function(callback){
      console.log('req.body._id:' + JSON.stringify(req.body));
      Poi.findOne({_id: req.body._id}, function(err, poi){
        if (err){ 
          callback(err);
        } else {
          callback(null, poi);
          console.log("poi =====" + poi);
        }        
      });
    },
    function(poi, callback){   
      Poi.findOne({poi_number: {$regex: req.body.poi_number, $options: 'i'}, building_id: poi.building_id, createdBy: req.user._id}, function(err, result){
        if (err){ 
          callback(err);
        } else {        
          if (result != null && result._id != req.body._id) {
            err = 'The Point of Interest number already existed.';
            callback(err, null);
          } else {
            console.log('poi data is ======' + JSON.stringify(poi));
            callback(null, poi);
          }
        }
      });
      
    },
    function(poi, callback){
      Timeslot.findOneAndUpdate({name: poi.opening_hours, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, timeslot){
        if (err) callback(err); else callback(null, poi);
      });
    },

    function(poi, callback){
      Timeslot.findOneAndUpdate({name: poi.validity, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, timeslot){
        if (err) callback(err); else callback(null, poi);
      });
    },

    function(poi, callback){
      Category.findOneAndUpdate({_id: poi.category, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, result){
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
      Poi.findOneAndUpdate({_id: req.body._id}, req.body, function(err, poi){
        if (err) callback(err); else callback(null, poi);  
      });
    }    
  ], function(err, poi){
    if (err) return res.status(403).send(err);
    return res.status(200).send(poi);
  });
}

export function destroy(req, res) {

  async.waterfall([
    function(callback){
      Poi.findOne({_id: req.params.id}, function(err, poi){
        if (err) {
          callback(err);
        } else {
          callback(null, poi);
        }
      });
    },

    function(poi, callback){
      Timeslot.findOneAndUpdate({name: poi.opening_hours, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, timeslot){
        if (err) callback(err); else callback(null, poi);
      });
    },

    function(poi, callback){
      Timeslot.findOneAndUpdate({name: poi.validity, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, timeslot){
        if (err) callback(err); else callback(null, poi);
      });
    },

    function(poi, callback){
      Category.findOneAndUpdate({_id: poi.category, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, result){
        if (err) callback(err); else callback(null, 'success');
      });
    },

    function(result, callback){
      Poi.findOneAndRemove({_id: req.params.id}, function(err, result){
        if (err) callback(err); else callback(null, 'success');
      });
    }
  ], function(err, callback){
    if(err) calback(err);
    return res.status(204).end();
  });
}