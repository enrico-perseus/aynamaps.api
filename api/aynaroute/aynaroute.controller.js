
'use strict';

import AynaRoute from './aynaroute.model';
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


export function index(req, res) {
  return AynaRoute.find({}, '-salt -password').exec()
    .then(aynaroute => {
      res.status(200).json(aynaroute);
    })
    .catch(handleError(res));
}

export function me(req, res) {
  var userId = req.user._id;
    return AynaRoute.find({createdBy: userId}).populate('createdBy').then(function(aynaroute) {
      res.status(200).send(aynaroute);
    })
    .catch(validationError(res));
}

export function create(req, res) {  

  let aynarouteData = req.body;
  aynarouteData.createdBy = req.user._id;
  let newAynaRoute = new AynaRoute(aynarouteData);
  console.log(aynarouteData );

  return AynaRoute.findOne({floor_id: { $regex: aynarouteData.floor_id, $options: 'i'}, createdBy: req.user._id}).exec()
    .then(aynaroute => {
      if (aynaroute != null) {
   
        return res.status(403).send('The aynaroute already existed.');
      }

      return newAynaRoute.save().then(function(aynaroute) {
        res.status(200).send(aynaroute);
      })
      .catch(validationError(res));
    })
    .catch(validationError(res));
}
 
export function show(req, res, next) {

  return AynaRoute.findOne({_id: req.params.id}).exec()
    .then(aynaroute => {
      if(!aynaroute) {
        return res.status(404).end();
      }
      res.json(aynaroute);
    })
    .catch(err => next(err));
}

export function update(req, res) {
  console.log("update");
  
  async.waterfall([
    function(callback){
      AynaRoute.findOne({_id: req.body._id}, function(err, aynaroute){
        if (err){ 
          callback(err);
        } else {
          callback(null, aynaroute);
          
        }        
      });
    },
    
    function(result, callback){
      AynaRoute.findOneAndUpdate({_id: req.body._id}, req.body, function(err, aynaroute){
        if (err) callback(err);
        callback(null, aynaroute);  
      });
    }    
  ], function(err, aynaroute){
    if (err) return res.status(403).send(err);
    return res.status(200).send(aynaroute);
  });
 
  /* return Beacon.findOne({beacon_code: { $regex: req.body.beacon_code, $options: 'i'}, createdBy: req.user._id}).exec()
    .then(beacon => {
      if (beacon != null && beacon._id != req.body._id) {
        return res.status(403).send('The beacon name already existed.');
      }

      Beacon.findOneAndUpdate({_id: req.body._id}, req.body).exec()
          .then(beacon => {
            return res.json(beacon);
          })
          .catch(validationError(res));
    })
    .catch(validationError(res)); */
}

export function destroy(req, res) {
  return AynaRoute.findOneAndRemove({_id: req.params.id}).exec()
    .then(function() {
      res.status(204).end();
    })
    .catch(handleError(res));
}
export function getByFloorId(req,res){
   return AynaRoute.findOne({floor_id: req.params.id}).exec()
    .then(aynaroute => {
      if(!aynaroute) {
        return res.status(404).end();
      }
      res.json(aynaroute);
    })
    .catch(err => next(err));
}