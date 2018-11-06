'use strict';

import Floor from './floor.model';
import Building from '../building/building.model';
import Destination from '../destinations/destinations.model';
import FloorAccess from '../flooraccess/flooraccess.model';
import Emergency from '../emergencies/emergencies.model';
import Facility from '../facilities/facilities.model';
import Category from '../category/category.model';
import Poi from '../poi/poi.model';
import Player from '../player/player.model';
import Group from '../group/group.model';
import Beacon from '../beacons/beacons.model';
import UsersInfo from '../users_info/users_info.model';
import Role from '../role/role.model';
import Timeslot from '../timeslot/timeslot.model';
import config from '../../config/environment';

import * as Fn from '../../components/shared/functions';
import { ValidationError } from 'mongoose';

const async = require('async');
var path = require('path');
var fs = require('fs');
var multer  = require('multer');
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    console.log('destination');
    cb(null, './assets/');
  },
  filename: function(req, file, cb) {
    console.log(file.fieldname);
    cb(null, file.fieldname + '-' + Date.now());
  }
});

var uploadmulter = multer({storage: storage}).single('file');


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
  // console.log('multer start');
  // uploadmulter(req, res, function(err) {
  //   console.log('in uploadmutter');
  //   if(err) {
  //     console.log("error start");
  //   }
  //   res.json({
  //     success: true,
  //     message: ''
  //   });
  // });
}
export function download(req, res){
  var downPath = req.query.path;
  fs.readFile(downPath, (err, data) => {
    if (err){
      return res.status(500).send(err);
    }

    return res.status(200).send(data);

  });
}
export function index(req, res) {
  return Floor.find({}, '-salt -password').exec()
    .then(floors => {
      res.status(200).json(floors);
    })
    .catch(handleError(res));
}

export function me(req, res) {
  var userId = req.user._id;
    return Floor.find({createdBy: userId}).populate('createdBy').then(function(floors) {
      res.status(200).send(floors);
    })
    .catch(validationError(res));
}

export function create(req, res) {

  let floorData = req.body;
  floorData.createdBy = req.user._id;
  let newFloor = new Floor(floorData);
  console.log(floorData);

  async.waterfall([
    function(callback){
      Floor.findOne({short_name: {$regex: floorData.short_name, $options: 'i'}, createdBy: req.user._id}, function(err, floor){
        if (err) callback(err);
        if (floor != null) {
          err = 'The floor showt name already existed.';
          callback(err, null);
        } else {
          callback(null, 'success');
        }
      });
    },

    function(result,callback){
      Timeslot.findOneAndUpdate({name: floorData.opening_hours, createdBy: req.user._id}, {$inc: {"usage.use_number": 1}}, function(err, result){
        if (err) callback(err);
        callback(null, 'success');
      });
    },

    function(result,callback){
      Timeslot.findOneAndUpdate({name: floorData.validity, createdBy: req.user._id}, {$inc: {"usage.use_number": 1}}, function(err, result){
        if (err) callback(err);
        callback(null, 'success');
      });
    },

    function(result, callback){
      newFloor.save(function(err, floor){
        if(err) callback(err);
        callback(null, floor);
      });
    }], function(err, result){
      if(err) return res.status(403).send(err);
      return res.status(200).send(result);
    });
}

export function show(req, res, next) {

  return Floor.findOne({_id: req.params.id}).exec()
    .then(floor => {
      if(!floor) {
        return res.status(404).end();
      }
      res.json(floor);
    })
    .catch(err => next(err));
}

export function building_show(req, res) {
  var building_id = req.params.id;
  var positions = [];
  Floor.find({building_id: building_id, createdBy: req.user._id}).exec()
    .then(Floors => {
      var result = {type: 'Floors-Maps', number: Floors.length, route: 'floormaps', floors : Floors}
      if (Floors.length > 0) positions.push(result);
      FloorAccess.find({building_id: building_id, createdBy: req.user._id}).exec()
        .then(FloorAccesses => {
          var result = {type: 'FloorAccesses', number: Floors.length, route: 'flooraccess', flooraccesses : FloorAccesses}
          if (FloorAccesses.length > 0) positions.push(result);
          return res.status(200).send(positions);
        })
        .catch(validationError(res));
    })
    .catch(validationError(res));
}

export function getFloorOdersBybuildingId(req, res) {
  var building_id = req.params.id;
  console.log(building_id);
  Floor.find({building_id: building_id, createdBy: req.user._id}).exec()
    .then(Floors => {
          return res.status(200).send(Floors);
    })
    .catch(validationError(res));
}

export function update(req, res) {
  console.log("update");
  async.waterfall([
    function(callback){
      Floor.findOne({short_name: {$regex: req.body.short_name, $options: 'i'}, createdBy: req.user._id}, function(err, floor){
        if (err){
          callback(err);
        }

        if (floor != null && floor._id != req.body._id) {
          err = 'The floor short name already existed.';
          callback(err, null);
        } else {
          callback(null, floor);
        }
      });
    },
    function(floor, callback){
      Timeslot.findOneAndUpdate({name: floor.opening_hours, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, timeslot){
        if (err) callback(err);
        callback(null, floor);
      });
    },

    function(floor, callback){
      Timeslot.findOneAndUpdate({name: floor.validity, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, timeslot){
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
      Floor.findOneAndUpdate({_id: req.body._id}, req.body, function(err, floor){
        if (err) callback(err);
        callback(null, floor);
      });
    }
  ], function(err, floor){
    if (err) return res.status(403).send(err);
    return res.status(200).send(floor);
  });
}

export function destroy(req, res) {
  async.waterfall([
    function(callback){
      Floor.findOne({_id: req.params.id}, function(err, floor){
        if (err) callback(err);
        callback(null, floor);
      });
    },

    function(floor, callback){
      Timeslot.findOneAndUpdate({name: floor.opening_hours, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, timeslot){
        if (err) callback(err);
        callback(null, floor);
      });
    },

    function(floor, callback){
      Timeslot.findOneAndUpdate({name: floor.validity, createdBy: req.user._id}, {$inc: {"usage.use_number": -1}}, function(err, timeslot){
        if (err) callback(err);
        callback(null, 'success');
      });
    },

    function(result, callback){
      Floor.findOneAndRemove({_id: req.params.id}, function(err, result){
        if (err) callback(err);
        callback(null, 'success');
      });
    }
  ], function(err, callback){
    if(err) calback(err);
    return res.status(204).end();
  });
}

export function getLoationByFloorId(req, res){
  var floor_id = req.params.id;
  var positions = [];

  async.waterfall([
    function(callback){
      Poi.find({floor_id: floor_id, createdBy: req.user._id }, function(err, Pois){
        if (err) callback(err);
        var result = {type: 'Point of Interests', number: Pois.length, route: 'pointsofinterest'}
        if (Pois.length > 0) positions.push(result);
        callback(null, positions);
      });
    },
    function(positions, callback){
      Facility.find({floor_id: floor_id, createdBy: req.user._id },  function(err, Facilities){
        if (err) callback(err);
        var result = {type: 'Facilities', number: Facilities.length, route: 'facilities'}
        if (Facilities.length > 0) positions.push(result);
        callback(null, positions);
      });
    },
    function(positions, callback){
      Destination.find({floor_id: floor_id, createdBy: req.user._id }, function(err, Destinations){
        if (err) callback(err);
        var result = {type: 'Destinations', number: Destinations.length, route: 'destinations'}
        if (Destinations.length > 0) positions.push(result);
        callback(null, positions);
      });
    },
    function(positions, callback){
      Emergency.find({floor_id: floor_id, createdBy: req.user._id }, function(err, Emergencies){
        if (err) callback(err);
        var result = {type: 'Emergencies', number: Emergencies.length, route: 'emergencies'}
        if (Emergencies.length > 0) positions.push(result);
        callback(null, positions);
      });
    },
    function(positions, callback){
      Player.find({floor_id: floor_id, createdBy: req.user._id }, function(err, Players){
        if (err) callback(err);
        var result = {type: 'Players', number: Players.length, route: 'players'}
        if (Players.length > 0) positions.push(result);
        callback(null, positions);
      });
    },
    function(positions, callback){
      Beacon.find({floor_id: floor_id, createdBy: req.user._id }, function(err, Beacons){
        if (err) callback(err);
        var result = {type: 'Beacons', number: Beacons.length, route: 'beacons'}
        if (Beacons.length > 0) positions.push(result);
        callback(null, positions);
      });
    },
  ],function(err, result){
    if (err) callback(err);
    return res.status(200).send(result);
  })
}

export function searchbyName(req, res){
  var search = req.params.name;
  var positions = [];

  async.waterfall([
    function(callback){
      Building.find({$or: [
                            {"building_id": { $regex: '.*' + search + '.*', $options: 'i'}},
                            {"building_name.name": { $regex: '.*' + search + '.*', $options: 'i'}},
                            /* {"no_of_floors": { $regex: '.*' + search + '.*'}}, */
                            {"opening_hours": { $regex: '.*' + search + '.*'}},
                            {"validity": { $regex: '.*' + search + '.*'}},
                            /* {"status": { $regex: '.*' + search + '.*'}}, */
                            {"city": { $regex: '.*' + search + '.*'}},
                            {"tags.displayValue": { $regex: '.*' + search + '.*', $options: 'i'}}
                          ],
                          createdBy: req.user._id }, function(err, Buildings){
        if (err) callback(err); else {
          var result = {type: 'Buildings', number: Buildings.length, route: 'buildings'}
          if (Buildings.length > 0) positions.push(result);
          callback(null, positions);
        }
      });
    },

    function(positions, callback){
      Floor.find({$or:  [
                        {"short_name": { $regex: '.*' + search + '.*', $options: 'i'}},
                        {"long_name": { $regex: '.*' + search + '.*', $options: 'i'}},
                        {"tags.displayValue": { $regex: '.*' + search + '.*', $options: 'i'}},
                        {"opening_hours": { $regex: '.*' + search + '.*', $options: 'i'}},
                        {"validity": { $regex: '.*' + search + '.*', $options: 'i'}},
                        /* {"status": { $regex: '.*' + search + '.*', $options: 'i'}}, */
                        {"building_id": { $regex: '.*' + search + '.*', $options: 'i'}}
                        ], createdBy: req.user._id }, function(err, Floors){
        if (err) callback(err); else {
          var result = {type: 'Floors-Maps', number: Floors.length, route: 'floormaps'}
          if (Floors.length > 0) positions.push(result);
          callback(null, positions);
        }
      });
    },

    function(positions, callback){
      FloorAccess.find({$or:  [
                        {"flooraccess_code": { $regex: '.*' + search + '.*', $options: 'i'}},
                        {"type": { $regex: '.*' + search + '.*', $options: 'i'}},
                        {"parent": { $regex: '.*' + search + '.*', $options: 'i'}},
                        {"validity": { $regex: '.*' + search + '.*', $options: 'i'}},
                        /* {"status": { $regex: '.*' + search + '.*', $options: 'i'}}, */
                        {"building_id": { $regex: '.*' + search + '.*', $options: 'i'}}
                        ], createdBy: req.user._id }, function(err, FloorAccesses){
        if (err) callback(err); else {
          var result = {type: 'Floors-Access', number: FloorAccesses.length, route: 'flooraccess'}
          if (FloorAccesses.length > 0) positions.push(result);
          callback(null, positions);
        }
      });
    },

    function(positions, callback){
      Poi.find({$or: [
                      {"poi_number": { $regex: '.*' + search + '.*', $options: 'i'}},
                      {"poi_name": { $regex: '.*' + search + '.*', $options: 'i'}},
                      {"tags.displayValue": { $regex: '.*' + search + '.*', $options: 'i'}},
                      {"building_id": { $regex: '.*' + search + '.*', $options: 'i'}},
                      {"floor_id": { $regex: '.*' + search + '.*', $options: 'i'}},
                      {"parent": { $regex: '.*' + search + '.*', $options: 'i'}},
                      {"opening_hours": { $regex: '.*' + search + '.*', $options: 'i'}},
                      {"validity": { $regex: '.*' + search + '.*', $options: 'i'}},
                      {"website": { $regex: '.*' + search + '.*', $options: 'i'}},
                      {"email": { $regex: '.*' + search + '.*', $options: 'i'}},
                      {"phone": { $regex: '.*' + search + '.*', $options: 'i'}},
                      /* {"status": { $regex: '.*' + search + '.*', $options: 'i'}} */
                      ], createdBy: req.user._id }, function(err, Pois){
        if (err) callback(err); else {
          var result = {type: 'Point of Interests', number: Pois.length, route: 'pointsofinterest'}
          if (Pois.length > 0) positions.push(result);
          callback(null, positions);
        }
      });
    },
    function(positions, callback){
      Facility.find({$or: [
                          {"facility_code": { $regex: '.*' + search + '.*', $options: 'i'}},
                          {"facility_name": { $regex: '.*' + search + '.*', $options: 'i'}},
                          {"tags.displayValue": { $regex: '.*' + search + '.*', $options: 'i'}},
                          {"building_id": { $regex: '.*' + search + '.*', $options: 'i'}},
                          {"floor_id": { $regex: '.*' + search + '.*', $options: 'i'}},
                          {"parent": { $regex: '.*' + search + '.*', $options: 'i'}},
                          {"opening_hours": { $regex: '.*' + search + '.*', $options: 'i'}},
                          {"validity": { $regex: '.*' + search + '.*', $options: 'i'}},
                          {"website": { $regex: '.*' + search + '.*', $options: 'i'}},
                          {"email": { $regex: '.*' + search + '.*', $options: 'i'}},
                          {"phone": { $regex: '.*' + search + '.*', $options: 'i'}},
                          //{"status": { $regex: '.*' + search + '.*', $options: 'i'}} */
                          ], createdBy: req.user._id },  function(err, Facilities){
        if (err) callback(err); else {
          var result = {type: 'Facilities', number: Facilities.length, route: 'facilities'}
          if (Facilities.length > 0) positions.push(result);
          callback(null, positions);
        }
      });
    },
    function(positions, callback){
      Destination.find({$or: [
                              {"destination_code": { $regex: '.*' + search + '.*', $options: 'i'}},
                              {"destination_name": { $regex: '.*' + search + '.*', $options: 'i'}},
                              {"tags.displayValue": { $regex: '.*' + search + '.*', $options: 'i'}},
                              {"building_id": { $regex: '.*' + search + '.*', $options: 'i'}},
                              {"floor_id": { $regex: '.*' + search + '.*', $options: 'i'}},
                              {"parent": { $regex: '.*' + search + '.*', $options: 'i'}},
                              {"opening_hours": { $regex: '.*' + search + '.*', $options: 'i'}},
                              {"validity": { $regex: '.*' + search + '.*', $options: 'i'}},
                              {"website": { $regex: '.*' + search + '.*', $options: 'i'}},
                              {"email": { $regex: '.*' + search + '.*', $options: 'i'}},
                              {"phone": { $regex: '.*' + search + '.*', $options: 'i'}},
                              //{"status": { $regex: '.*' + search + '.*', $options: 'i'}}
                              ] , createdBy: req.user._id }, function(err, Destinations){
        if (err) callback(err); else {
          var result = {type: 'Destinations', number: Destinations.length, route: 'destinations'}
          if (Destinations.length > 0) positions.push(result);
          callback(null, positions);
        }
      });
    },
    function(positions, callback){
      Emergency.find({$or: [
                            {"emergency_code": { $regex: '.*' + search + '.*', $options: 'i'}},
                            {"emergency_name": { $regex: '.*' + search + '.*', $options: 'i'}},
                            {"tags.displayValue": { $regex: '.*' + search + '.*', $options: 'i'}},
                            {"building_id": { $regex: '.*' + search + '.*', $options: 'i'}},
                            {"floor_id": { $regex: '.*' + search + '.*', $options: 'i'}},
                            {"parent": { $regex: '.*' + search + '.*', $options: 'i'}},
                            {"opening_hours": { $regex: '.*' + search + '.*', $options: 'i'}},
                            {"validity": { $regex: '.*' + search + '.*', $options: 'i'}},
                            {"website": { $regex: '.*' + search + '.*', $options: 'i'}},
                            {"email": { $regex: '.*' + search + '.*', $options: 'i'}},
                            {"phone": { $regex: '.*' + search + '.*', $options: 'i'}},
                            //{"status": { $regex: '.*' + search + '.*', $options: 'i'}}
                            ] , createdBy: req.user._id }, function(err, Emergencies){
        if (err) callback(err); else {
          var result = {type: 'Emergencies', number: Emergencies.length, route: 'emergencies'}
          if (Emergencies.length > 0) positions.push(result);
          callback(null, positions);
        }
      });
    },

    function(positions, callback){
      Category.find({$or: [
                            {"name": { $regex: '.*' + search + '.*', $options: 'i'}},
                            /* {"status": { $regex: '.*' + search + '.*', $options: 'i'}} */
                            ] , createdBy: req.user._id }, function(err, Categories){
        if (err) callback(err); else {
          var result = {type: 'Categories', number: Categories.length, route: 'categories'}
          if (Categories.length > 0) positions.push(result);
          callback(null, positions);
        }
      });
    },
    function(positions, callback){
      Player.find({$or: [
                        {"playerip": { $regex: '.*' + search + '.*', $options: 'i'}},
                        {"player_code": { $regex: '.*' + search + '.*', $options: 'i'}},
                        {"player_number": { $regex: '.*' + search + '.*', $options: 'i'}},
                        {"tags.displayValue": { $regex: '.*' + search + '.*', $options: 'i'}},
                        {"building_id": { $regex: '.*' + search + '.*', $options: 'i'}},
                        {"floor_id": { $regex: '.*' + search + '.*', $options: 'i'}},
                        {"type": { $regex: '.*' + search + '.*', $options: 'i'}},
                        {"map_rotate": { $regex: '.*' + search + '.*', $options: 'i'}},
                        {"orientation": { $regex: '.*' + search + '.*', $options: 'i'}},
                        /* {"status": { $regex: '.*' + search + '.*', $options: 'i'}} */
                        ] , createdBy: req.user._id }, function(err, Players){
        if (err) callback(err); else {
          var result = {type: 'Players', number: Players.length, route: 'players'}
          if (Players.length > 0) positions.push(result);
          callback(null, positions);
        }
      });
    },
    function(positions, callback){
      Group.find({$or: [
                        {"group_name": { $regex: '.*' + search + '.*', $options: 'i'}},
                        ] , createdBy: req.user._id }, function(err, Groups){
        if (err) callback(err); else {
          var result = {type: 'Groups', number: Groups.length, route: 'groups'}
          if (Groups.length > 0) positions.push(result);
          callback(null, positions);
        }
      });
    },
    function(positions, callback){
      Beacon.find({$or: [
                        {"beacon_code": { $regex: '.*' + search + '.*', $options: 'i'}},
                        {"type": { $regex: '.*' + search + '.*', $options: 'i'}},
                        {"brand": { $regex: '.*' + search + '.*', $options: 'i'}},
                        {"mac": { $regex: '.*' + search + '.*', $options: 'i'}},
                        {"tags.displayValue": { $regex: '.*' + search + '.*', $options: 'i'}},
                        {"building_id": { $regex: '.*' + search + '.*', $options: 'i'}},
                        {"floor_id": { $regex: '.*' + search + '.*', $options: 'i'}},
                        {"brand": { $regex: '.*' + search + '.*', $options: 'i'}},
                        {"mac": { $regex: '.*' + search + '.*', $options: 'i'}},
                        /* {"status": { $regex: '.*' + search + '.*', $options: 'i'}} */
                        ] , createdBy: req.user._id }, function(err, Beacons){
        if (err) callback(err); else {
          var result = {type: 'Beacons', number: Beacons.length, route: 'beacons'};
          if (Beacons.length > 0) positions.push(result);
          callback(null, positions);
        }
      });
    },
    function(positions, callback){
      UsersInfo.find({$or: [
                        {"name": { $regex: '.*' + search + '.*', $options: 'i'}},
                        {"email": { $regex: '.*' + search + '.*', $options: 'i'}},
    /*                     {"phone_number": { $regex: '.*' + search + '.*'}}, */
                        {"type": { $regex: '.*' + search + '.*', $options: 'i'}},
                        ] , createdBy: req.user._id }, function(err, Users){
        if (err) callback(err); else {
          var result = {type: 'Users', number: Users.length, route: 'users'};
          if (Users.length > 0) positions.push(result);
          callback(null, positions);
        }
      });
    },
    function(positions, callback){
      Role.find({$or: [
                        {"role_name": { $regex: '.*' + search + '.*', $options: 'i'}},
                        /* {"status": { $regex: '.*' + search + '.*', $options: 'i'}} */
                        ] , createdBy: req.user._id }, function(err, Roles){
        if (err) callback(err); else {
          var result = {type: 'Roles', number: Roles.length, route: 'roles'}
          if (Roles.length > 0) positions.push(result);
          callback(null, positions);
        }
      });
    },
    function(positions, callback){
      Timeslot.find({$or: [
                        {"name": { $regex: '.*' + search + '.*', $options: 'i'}},
                        ] , createdBy: req.user._id }, function(err, Timeslots){
        if (err) callback(err); else {
          var result = {type: 'Timeslots', number: Timeslots.length, route: 'timeslots'}
          if (Timeslots.length > 0) positions.push(result);
          callback(null, positions);
        }
      });
    }
  ],function(err, result){
    if (err) callback(err);
    return res.status(200).send(result);
  })
}
