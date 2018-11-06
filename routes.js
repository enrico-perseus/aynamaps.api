/**
 * Main application routes
 */

'use strict';

import express from 'express';
import errors from './components/errors';
import path from 'path';

export default function(app) {
  // Insert routes below
  app.use('/api/things', require('./api/thing'));
  app.use('/api/users', require('./api/user'));
  app.use('/api/customers', require('./api/customer'));
  app.use('/api/categories', require('./api/category'));
  app.use('/api/timeslots', require('./api/timeslot'));
  app.use('/api/countries', require('./api/country'));
  app.use('/api/buildings', require('./api/building'));
  app.use('/api/floors', require('./api/floor'));
  app.use('/api/pois', require('./api/poi'));
  app.use('/api/facilities', require('./api/facilities'));
  app.use('/api/destinations', require('./api/destinations'));
  app.use('/api/flooraccesses', require('./api/flooraccess'));
  app.use('/api/emergencies', require('./api/emergencies'));

  app.use('/api/groups', require('./api/group'));
  app.use('/api/players', require('./api/player'));
  app.use('/api/beacons', require('./api/beacons'));
  app.use('/api/roles', require('./api/role'));
  app.use('/api/users_infos', require('./api/users_info'));
  app.use('/api/languages', require('./api/language'));
  app.use('/api/nASettings', require('./api/notification_alert_setting'));
  app.use('/auth', require('./auth').default);
  app.use('/api/aynaroute', require('./api/aynaroute'));

  app.use(express.static(__dirname + '/public'));

  app.route('/:url(assets)/*')
  .get((req, res) => {
    res.sendFile(path.resolve('./') + req.url);
  });

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|components|app|bower_components)/*')
    .get(errors[404]);
  
  // All other routes should redirect to the index.html
  app.route('/*')
    .get((req, res) => {
      res.sendFile(path.resolve(`${__dirname + '/../public'}/index.html`));
    });
}
