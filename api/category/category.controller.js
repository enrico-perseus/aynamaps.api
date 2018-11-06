'use strict';

import Category from './category.model';
import Poi from '../poi/poi.model';
import Facility from '../facilities/facilities.model';
import Destination from '../destinations/destinations.model';
import Emergency from '../emergencies/emergencies.model';
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
  return Language.find({}, '-salt -password').exec()
    .then(languages => {
      res.status(200).json(languages);
    })
    .catch(handleError(res));
}

export function me(req, res) {
  var userId = req.user._id;
    return Category.find({createdBy: userId}).populate('createdBy').then(function(categories) {
      res.status(200).send(categories);
    })
    .catch(validationError(res));
}

/**
 * Creates a new language
 */
export function create(req, res) {  

  let categoryData = req.body;
  categoryData.createdBy = req.user._id;
  categoryData.usage = {
    use_number: 0,
    use_item: []
  }
  let newCategory = new Category(categoryData);
  console.log(categoryData);

  return Category.findOne({name: {$regex: categoryData.name, $options: 'i'}, createdBy: req.user._id}).exec()
    .then(category => {            
      
      if (category != null) {
        return res.status(403).send('The category name already existed.');
      }

      return newCategory.save().then(function(category) {
        res.status(200).send(category);
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
  return Category.findOne({name: {$regex: req.body.name, $options: 'i'}, createdBy: req.user._id}).exec()
    .then(category => {
      if (category != null && category._id != req.body._id) {
        return res.status(403).send('The category name already existed.');
      }

      Category.findOneAndUpdate({_id: req.body._id}, req.body).exec()
          .then(category => {
            return res.json(category);
          })
          .catch(validationError(res));
    })
    .catch(validationError(res));
}

export function findUsingbyID(req, res) {

  console.log("enter find using by category by id =====" + JSON.stringify(req.params));
  var positions = [];
  async.waterfall([
    function(callback){
      Poi.find({"category": req.params.id, createdBy: req.user._id }, {poi_number: 1}, function(err, Pois){
        if (err) callback(err);
        var result = {type: 'Point of Interests', position_name: 'poi_number', position: Pois, route: 'pointsofinterest'}
        if (Pois.length > 0) positions.push(result);
        callback(null, positions);        
      }); 
    },

    function(positions, callback){
      Facility.find({"category": req.params.id , createdBy: req.user._id }, {facility_code: 1}, function(err, Facilities){
        if (err) callback(err);
        var result = {type: 'Facilities', position_name:'facility_code', position: Facilities, route: 'facilities'}
        if (Facilities.length > 0) positions.push(result);
        callback(null, positions);        
      }); 
    },

    function(positions, callback){
      Destination.find({"category": req.params.id, createdBy: req.user._id }, {destination_code: 1}, function(err, Destinations){
        if (err) callback(err);
        var result = {type: 'Destinations', position_name: 'destination_code', position: Destinations, route: 'destinations'}
        if (Destinations.length > 0) positions.push(result);
        callback(null, positions);        
      }); 
    },

    function(positions, callback){
      Emergency.find({"category": req.params.id, createdBy: req.user._id }, {emergency_code: 1}, function(err, Emergencies){
        if (err) callback(err);
        var result = {type: 'Emergencies', position_name:'emergency_code', position: Emergencies, route: 'emergencies'}
        if (Emergencies.length > 0) positions.push(result);
        callback(null, positions);        
      }); 
    }
  ], function(err, result) {
        if(err) callback(err);
        console.log("category by id search result================" + JSON.stringify(result));  // OUTPUT OK
        return res.status(200).send(result);
    }
  );
}

export function destroy(req, res) {
  return Category.findOneAndRemove({_id: req.params.id}).exec()
    .then(function() {
      res.status(204).end();
    })
    .catch(handleError(res));
}