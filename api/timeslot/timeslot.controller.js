'use strict';

import Timeslot from './timeslot.model';
import Building from '../building/building.model';
import Floor from '../floor/floor.model';
import Destination from '../destinations/destinations.model';
import Emergency from '../emergencies/emergencies.model';
import Facility from '../facilities/facilities.model';
import FloorAccess from '../flooraccess/flooraccess.model';
import Poi from '../poi/poi.model';

import config from '../../config/environment';

import * as Fn from '../../components/shared/functions';

const async = require('async');
var path = require('path');
var fs = require('fs');

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
  return Timeslot.find({}, /*{createdBy: req.user._id},*/ '-salt -password').exec()
    .then(timeslots => {
      console.log(timeslots);
      res.status(200).json(timeslots);
    })
    .catch(handleError(res));
}

export function me(req, res) {
  var userId = req.user._id;
    return Timeslot.find({createdBy: userId}).populate('createdBy').then(function(timeslots) {
      res.status(200).json(timeslots);
    })
    .catch(validationError(res));
}
/**
 * Creates a new user
 */
export function create(req, res) {  

  let timeslotData = req.body;
  timeslotData.createdBy = req.user._id;
  let newTimeslot = new Timeslot(timeslotData);
  console.log("timeslotData=======" + timeslotData);
  return Timeslot.findOne({"name": {$regex: timeslotData.name, $options: 'i'}, createdBy: req.user._id}).exec()
    .then(timeslot => {            
      
      if (timeslot != null) {
        return res.status(403).send('The timeslot name already existed.');
      }

      return newTimeslot.save().then(function(timeslot) {
        res.status(200).send(timeslot);
      })
      .catch(validationError(res));
    })
    .catch(validationError(res));
}

export function show(req, res, next) {

  return Timeslot.findOne({_id: req.params.id}).exec()
    .then(timeslot => {
      if(!timeslot) {
        return res.status(404).end();
      }
      res.json(timeslot);
      console.log(timeslot);
      //res.status(200).send(timeslot);
    })
    .catch(err => next(err));
}

export function update(req, res) {
  console.log("enter timesolt update api====" + req.body._id);
  return Timeslot.findOne({name: {$regex: req.body.name, $options: 'i'}, createdBy: req.user._id}).exec()
    .then(timeslot => {
      if (timeslot != null && timeslot._id != req.body._id) {
        return res.status(403).send('The specified name is already in use.');
      }
          Timeslot.findOneAndUpdate({_id: req.body._id}, req.body).exec()
          .then(timeslot => {
            return res.json(timeslot);
          })
          .catch(validationError(res));
    })
    .catch(validationError(res));
}

export function findUsingbyName(req, res) {
  console.log("enter find using by timeslot name api");
  var positions = [];
  async.waterfall([
    function(callback) {
      Building.find({$or: [{"opening_hours": req.params.name}, {"validity": req.params.name} ], createdBy: req.user._id }, {building_id: 1}, function(err, Buildings){
        if (err) callback(err);
        var result = {type: 'Buildings', position_name: 'building_id',  position: Buildings, route: 'buildings'}
        if (Buildings.length > 0) positions.push(result);
        callback(null, positions);        
      });      
    },

    function(positions, callback){
      Floor.find({$or: [{"opening_hours": req.params.name}, {"validity": req.params.name} ] , createdBy: req.user._id }, {short_name: 1}, function(err, Floors){
        if (err) callback(err);
        var result = {type: 'Floors-Maps', position_name: 'short_name', position: Floors, route: 'floormaps'}
        if (Floors.length > 0) positions.push(result);
        callback(null, positions);        
      }); 
    },

    function(positions, callback){
      Poi.find({$or: [{"opening_hours": req.params.name}, {"validity": req.params.name} ] , createdBy: req.user._id }, {poi_number: 1}, function(err, Pois){
        if (err) callback(err);
        var result = {type: 'Point of Interests', position_name: 'poi_number', position: Pois, route: 'pointsofinterest'}
        if (Pois.length > 0) positions.push(result);
        callback(null, positions);        
      }); 
    },

    function(positions, callback){
      Facility.find({$or: [{"opening_hours": req.params.name}, {"validity": req.params.name} ] , createdBy: req.user._id }, {facility_code: 1}, function(err, Facilities){
        if (err) callback(err);
        var result = {type: 'Facilities', position_name:'facility_code', position: Facilities, route: 'facilities'}
        if (Facilities.length > 0) positions.push(result);
        callback(null, positions);        
      }); 
    },

    function(positions, callback){
      Destination.find({$or: [{"opening_hours": req.params.name}, {"validity": req.params.name} ] , createdBy: req.user._id }, {destination_code: 1}, function(err, Destinations){
        if (err) callback(err);
        var result = {type: 'Destinations', position_name: 'destination_code', position: Destinations, route: 'destinations'}
        if (Destinations.length > 0) positions.push(result);
        callback(null, positions);        
      }); 
    },

    function(positions, callback){
      Emergency.find({$or: [{"opening_hours": req.params.name}, {"validity": req.params.name} ] , createdBy: req.user._id }, {emergency_code: 1}, function(err, Emergencies){
        if (err) callback(err);
        var result = {type: 'Emergencies', position_name:'emergency_code', position: Emergencies, route: 'emergencies'}
        if (Emergencies.length > 0) positions.push(result);
        callback(null, positions);        
      }); 
    },

    function(positions, callback){
      FloorAccess.find({"validity": req.params.name , createdBy: req.user._id }, {flooraccess_code: 1}, function(err, FloorAccesses){
        if (err) callback(err);
        var result = {type: 'FloorAccesses', position_name:'flooraccess_code', position: FloorAccesses, route: 'flooraccess'}
        if (FloorAccesses.length > 0) positions.push(result);
        callback(null, positions);        
      }); 
    }

  ], function(err, result) {
        if(err) callback(err);
        console.log("building search result================" + JSON.stringify(result));  // OUTPUT OK
        return res.status(200).send(result);
    }
  );
}

export function destroy(req, res) {
  return Timeslot.findOneAndRemove({_id: req.params.id}).exec()
    .then(function() {
      res.status(204).end();
    })
    .catch(handleError(res));
}