'use strict';

import Customer from './customer.model';
import Timeslot from '../timeslot/timeslot.model';
import Role from '../role/role.model';
import Category from '../category/category.model';
import config from '../../config/environment';

import * as Fn from '../../components/shared/functions';

const async = require('async');
var path = require('path');
var fs = require('fs');

function generatePassword() {
  function s5() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s5() + s5();
}

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

/**
 * Get list of users
 * restriction: 'admin'
 */
export function index(req, res) {
  return Customer.find({}, /*{createdBy: req.user._id},*/ '-salt -password').exec()
    .then(users => {
      //console.log(users);
      res.status(200).json(users);
    })
    .catch(handleError(res));
}

/**
 * Creates a new user
 */
export function create(req, res) {  
  let newCustomerData = req.body;
  let password = generatePassword();
  newCustomerData.password = password;
  newCustomerData.role = 'admin';
  newCustomerData.createdBy = req.user._id;
  let newUser = new Customer(newCustomerData);
  
  async.waterfall([
    function(callback) {
      Customer.findOne({email: newCustomerData.email}, function(err, user){
        if(err) callback(err);
        if (user != null) {
          err = 'The specified email is already in use.'          
          callback(err, null);
        } else {
        callback(null, 'success');
        }
      });      
    },
    function(result, callback){
      Customer.findOne({account_name: newCustomerData.account_name}, function(err, user){
        if(err) callback(err);
        if (user != null) {
            err = 'The specified account name is already in use.';
            callback(err, null);
        } else {  
        callback(null, 'success');
        }
      });
    },
    function(result, callback){
      newUser.save(function(err, user){
        if(err) callback('User adding failed');
        callback(null, user);
      });
    },
    
    function(user, callback){
      let user_id = user._id;
      let newTimeslotData = {};
      let today = "2018-01-01T00:00:00";//new Date();
      let component =      ['name',  'start_date', 'end_date', 'createdBy', 'start_time', 'end_time',            'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'is_all_day'];
      let component_data = ['Always', today,       '',      user_id,   today,       '2018-01-01T23:59:59', '1',      '1',      '1',       '1',         '1',         '1',      '1',       '1'];
      for (let i = 0; i < component.length; i++){
        newTimeslotData[component[i]] = component_data[i];
      }           
      let newTimeslot = new Timeslot(newTimeslotData);
      newTimeslot.save(function(err, timeslot) {
        if(err) callback(err);
        callback(null, timeslot);
      });
    },

    function(timeslot, callback){
      let newTimeslotData = {};
      let today = "2018-01-01T08:00:00";//new Date();
      let component =      ['name',  'start_date', 'end_date', 'createdBy',        'start_time', 'end_time',            'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'is_all_day'];
      let component_data = ['USUAL',  today,        '',      timeslot.createdBy,   today,      '2018-01-01T17:00:00', '1',      '1',      '1',       '1',         '1',         '0',      '0',       '0'];
      for (let i = 0; i < component.length; i++){
        newTimeslotData[component[i]] = component_data[i];
      }
      let newTimeslot = new Timeslot(newTimeslotData);
      newTimeslot.save(function(err, timeslot) {
        if(err) callback(err);
        callback(null, timeslot);
      });
    },

    function(timeslot, callback){
      let newRoleData = {}
      let component =      ['role_name',     'createdBy',        'system_management', 'reports', 'network_management', 'content_management', 'status'];
      let component_data = ['Administrator', timeslot.createdBy, '0,1,1',             '1',       '0,1,1',              '0,1,1',              'true'];
      for (let i = 0; i < component.length; i++){
        newRoleData[component[i]] = component_data[i];
      } 
      let newRole = new Role(newRoleData);
      newRole.save(function(err, role) {
        if (err) callback(err);
        callback(null, role);
      });
    },

    function(role, callback){
      let newRoleData = {}
      let component =      ['role_name', 'createdBy',    'system_management', 'reports', 'network_management', 'content_management', 'status'];
      let component_data = ['Viewer',    role.createdBy, '1,0,0',             '1',         '1,0,0',             '1,0,0',             'true'];
      for (let i = 0; i < component.length; i++){
        newRoleData[component[i]] = component_data[i];
      } 
      let newRole = new Role(newRoleData);
      newRole.save(function(err, role) {
        if (err) callback(err);
        callback(null, role);
      });
    },

    function(role, callback){
      let newRoleData = {}
      let component =      ['role_name',     'createdBy',      'system_management', 'reports', 'network_management', 'content_management', 'status'];
      let component_data = ['Content Manager', role.createdBy, '0,0,0',            '0',         '0,0,0',             '0,1,1',               'true'];
      for (let i = 0; i < component.length; i++){
        newRoleData[component[i]] = component_data[i];
      } 
      let newRole = new Role(newRoleData);
      newRole.save(function(err, role) {
        if (err) callback(err);
        callback(null, role);
      });
    },

    function(role, callback){
      let newRoleData = {}
      let component =      ['role_name',     'createdBy',      'system_management', 'reports', 'network_management', 'content_management', 'status'];
      let component_data = ['Network Manager', role.createdBy, '0,0,0',            '0',         '0,1,1',             '0,0,0',              'true'];
      for (let i = 0; i < component.length; i++){
        newRoleData[component[i]] = component_data[i];
      } 
      let newRole = new Role(newRoleData);
      newRole.save(function(err, role) {
        if (err) callback(err);
        callback(null, role);
      });
    },

    function(role, callback){
      let newCategoryData = {}
      let component =      ['name',    'createdBy',    'customer_id',  'status'];
      let component_data = ['Default', role.createdBy, role.createdBy, 'Enable'];
      for (let i = 0; i < component.length; i++){
        newCategoryData[component[i]] = component_data[i];
      } 
      let newCategory = new Category(newCategoryData);
      newCategory.save(function(err, category) {
        if (err) callback(err);
        callback(null, category);
      });
    },

    function(result, callback){
      var mailOptions = {
        from: config.adminMailAddress,
        to: req.body.email,
        subject: 'Account Registration | Ayna',
        html: '<h3>Hi ' + req.body.user_type + ',</h3><h4>Your account on Ayna Has been Registered successfully</h4>Here Is your Temporary Password :' + password +
        '<br/>Use temporary password to login .<a href="' + config.siteUrl + '/auth/login">Click Here to Login</a>.'
      };
      console.log("email content is" + JSON.stringify(mailOptions));
      Fn.send_mail(mailOptions, function (err, info) {
        if(err) {
          callback('Created a customer successfully. However fail on send mail to customer.');
        } else {
          callback(null, 'Created a customer and send mail, successfully.');
        }
      });
    }
  ], function(err, result){
    if(err) return res.status(403).send(err);
    return res.status(200).send(result);
  });
}

export function update(req, res) {
  let newCustomerData = req.body;
  
  //let password = 'aaaaaa';//generatePassword();//'aaaaaa';//
  //newCustomerData.password = password;
  newCustomerData.role = 'admin';//
  newCustomerData.createdBy = req.user._id;
  let newUser = new Customer(newCustomerData);

  return Customer.findOne({email: req.body.email}).exec()
    .then(user => {
      if (user != null && user._id != req.body._id) {
        return res.status(403).send('The specified email is already in use.');
      }

      return Customer.findOne({account_name: req.body.account_name}).exec() 
        .then(user => {
          if (user != null && user._id != req.body._id) {
            return res.status(403).send('The specified account name is already in use.');
          }
          newCustomerData.password = user.password;
          Customer.findOneAndUpdate({_id: req.body._id}, newCustomerData).exec()
          .then(user => {
            return res.json(user);
          })
          .catch(validationError(res));
        })
        .catch(validationError(res));
    })
    .catch(validationError(res));
}

/**
 * Get a single user
 */
export function show(req, res, next) {
  var userId = req.params.id;

  return Customer.findOne({_id: req.params.id}).populate('language').exec()
    .then(user => {
      if(!user) {
        return res.status(404).end();
      }      
      console.log("user============" +  user);
      user.password = "";      
      res.json(user);
    })
    .catch(err => next(err));
}

/**
 * Deletes a user
 * restriction: 'admin'
 */
export function destroy(req, res) {
  return Customer.findOneAndRemove({_id: req.params.id, createdBy: req.user._id}).exec()
    .then(function() {
      res.status(204).end();
    })
    .catch(handleError(res));
}

export function changePassword(req, res) {
  var userId = req.user._id;
  var name = String(req.body.name);  
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);
  var avatarUrl = String(req.body.avatarUrl);

  if (oldPass == '' && newPass == '') {    
    return Customer.findById(userId).exec()
    .then(user => {
        user.avatar = avatarUrl;
        user.name = name;
        user.user_type = name;
        return user.save()
                .then(() => {
                  res.status(204).end();
                })
                .catch(validationError(res));
    });
  } else {
    return Customer.findById(userId).exec()
    .then(user => {
      if(user.authenticate(oldPass)) {

        var mailOptions = {
          from: config.adminMailAddress,
          to: user.email,
          subject: 'Account Password Changed | Ayna',
          html: '<h3>Hi ' + req.body.name + ',</h3>Your account password has been changed to  <b>' + newPass + '<b><br/>'
        };
        Fn.send_mail(mailOptions, function (err, info) {
          if(err) {
          } else {
          }
        });
        user.password = newPass;
        user.avatar = avatarUrl;
        user.name = name;
        return user.save()
                .then(() => {
                  res.status(204).end();
                })
                .catch(validationError(res));
      } else {
        return res.status(403).end();
      }
    });
  }
}

export function forgotPassword(req, res) {
  var email = req.body.email;
  let password = generatePassword();

  Customer.findOne({email: email}, function(err, customer) {
    if (customer == null) {
      res.status(200).send({
        code: 0,
        message: 'Email does not exist.'
      });

    } else {
        if (!customer.status) {
          res.status(200).send({
            code: 0,
            message: 'Your account was disabled.'
          });

        } else {
            customer.password = password;
            customer.save();
    
          var mailOptions = {
              from: config.adminMailAddress,
              to: req.body.email,
              subject: 'Account Forget Password | Ayna',
              html: '<h3>Hi ' + customer.user_type + ',</h3>Use temporary password to login.<br/> Your temp password is ' + password
          };
          Fn.send_mail(mailOptions, function (err, info) {
            if(err) {
              res.status(200).send({
                code: 0,
                message: 'Failed to send email',
                err: err
              });
              
            } else {
              res.status(200).send({
                code: 1,
                message: 'Your password was reset. Please check your email to get temp password.'
              });
            }
          });
        }
    }
  });
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

export function deleteAttachment(req, res) {  
  console.log(req.params);
  var filename = req.params.filename;
  var userId = req.params.id;
  console.log(userId);

  Customer.findById(userId).exec()
    .then(user => {
      var new_images = [];
      var images = user.customer_images;    
      for (var i = 0; i < images.length; i++) {
        if (images[i].indexOf(filename) == -1) {
          new_images.push(images[i]);
        }
      }
      console.log(new_images);

      return Customer.findOneAndUpdate({_id: userId}, {customer_images: new_images}).exec()
      .then(user1 => {
        user1.customer_images = new_images;
        return res.json(user1);
      })
      .catch(err => res.send(err));
    })
    .catch(err => res.send(err));
}

/**
 * Get my info
 */
export function me(req, res, next) {
  var userId = req.user._id;

  return Customer.findOne({ _id: userId }, '-salt -password').populate('language').exec()
    .then(user => { // don't ever give out the password or salt
      if(!user) {
        return res.status(401).end();
      }      
      console.log("profile =========" + user.profile);     
      return res.json(user.profile);
    })
    .catch(err => next(err));
}

/**
 * Authentication callback
 */
export function authCallback(req, res) {
  res.redirect('/');
}


export function sendMail(req, res) {
  var email = req.body.email;
  console.log(email);

  let password = generatePassword();

  return Customer.findOneAndUpdate({email: email}, {password: password}).exec()
    .then(user => {      
      if (user != null) {
        var mailOptions = {
          from: config.adminMailAddress,
          to: user.email,
          subject: 'Account Registration | Ayna',
          html: '<h3>Hi ' + user.user_type + ',</h3><h4>Your account on Ayna Has been Registered successfully</h4>Here Is your Temporary Password :' + password +
          '<br/>Use temporary password to login .<a href="' + config.siteUrl + '/auth/login">Click Here to Login</a>.'
        };
        Fn.send_mail(mailOptions, function (err, info) {
          if(err) {
            res.status(200).send({
              code: 0,
              message: 'Failed to send email',
              err: err
            });
          } else {
            res.status(200).send({
              code: 1,
              message: 'Succeed to send email.',
              err: null
            });
          }
        });
      }
    })
    .catch(validationError(res));
}

export function checkConnection(req, res) {
  return Customer.find({}).count().exec()
    .then(count => {
      res.status(200).send({
        code: 1,
        message: 'Connected'
      });
    })
    .catch(err => {
      res.status(200).send({
        code: 0,
        message: 'Disconected'
      });
    });
}

export function exportDB(req, res) {
  return Customer.find({}).exec()
    .then(customers => {
      fs.writeFile('customers.dat', JSON.stringify(customers), function(err) {
        if (err) {
          throw err;
          return;
        }
        
        res.writeHead(200, {
          'Content-Type': 'application/dat',
          'Content-Disposition': 'attachment; filename=customers.dat'
        });
        fs.createReadStream('customers.dat').pipe(res);

      })     
    })
    .catch(validationError(res));
}