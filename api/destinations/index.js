'use strict';

import { Router } from 'express';
import * as controller from './destinations.controller';
import * as auth from '../../auth/auth.service';

var router = new Router();

console.log("enter node api router");

router.post('/', auth.hasRole('admin', 'Customer'), controller.create);
router.get('/me', auth.isAuthenticated(),  controller.me);
router.get('/topList', auth.hasRole('admin', 'Customer'),  controller.getTopList);
router.get('/bottomList', auth.hasRole('admin', 'Customer'), controller.getBottomList);
router.put('/', auth.hasRole('admin', 'Customer'), controller.update);
router.get('/', auth.hasRole('admin', 'Customer'), controller.me);
router.get('/:id', auth.hasRole('admin', 'Customer'), controller.show);
router.delete('/:id', auth.hasRole('admin', 'Customer'), controller.destroy);
router.post('/upload', auth.hasRole('admin', 'Customer'), controller.upload);

module.exports = router;
