'use strict';

import Country from './country.model'
import config from '../../config/environment';

import * as Fn from '../../components/shared/functions';

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
  return Country.find({}, /*{createdBy: req.user._id},*/ '-salt -password').exec()
    .then(countries => {
      res.status(200).json(countries);
    })
    .catch(handleError(res));
}

export function me(req, res) {
  var userId = req.user._id;
    return Country.find({createdBy: userId}).populate('createdBy').then(function(countries) {
      res.status(200).json(countries);
    })
    .catch(validationError(res));
}

export function show(req, res, next) {

  return Country.findOne({_id: req.params.id}).exec()
    .then(country => {
      if(!country) {
        return res.status(404).end();
      }
      res.json(country);
      console.log(country);
    })
    .catch(err => next(err));
}