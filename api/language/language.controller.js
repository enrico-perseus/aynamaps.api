'use strict';

import Language from './language.model'
import config from '../../config/environment';

import * as Fn from '../../components/shared/functions';

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

/**
 * Creates a new language
 */
export function create(req, res) {  

  let languageData = req.body;
  languageData.createdBy = req.user._id;
  let newLanguage = new Language(languageData);

  return Language.findOne({language: languageData.language}).exec()
    .then(language => {

      console.log("language = " + language);
      console.log(languageData);
      
      if (language != null) {
        return res.status(403).send('The specified language have already registered.');
      }

      newLanguage.save().then(function(user) {
        res.status(200).send({
          message: 'Succeed to register new language information.'
        });
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
  return Language.findOne({language: req.body.language}).exec()
    .then(language => {
      if (language != null && language._id != req.body._id) {
        return res.status(403).send('The specified language is already registered.');
      }

      Language.findOneAndUpdate({_id: req.body._id}, req.body).exec()
          .then(language => {
            return res.json(language);
          })
          .catch(validationError(res));
    })
    .catch(validationError(res));
}

export function destroy(req, res) {
  return Language.findOneAndRemove({_id: req.params.id}).exec()
    .then(function() {
      res.status(204).end();
    })
    .catch(handleError(res));
}