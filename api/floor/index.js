'use strict';

import {Router} from 'express';
import * as controller from './floor.controller';
import * as auth from '../../auth/auth.service';

var router = new Router();

router.post('/', auth.hasRole('admin', 'Customer'), controller.create);
router.get('/me', auth.isAuthenticated(),  controller.me);
router.put('/', auth.hasRole('admin', 'Customer'), controller.update);
router.get('/', auth.hasRole('admin', 'Customer'), controller.me);
router.get('/getLocationbyId/:id', auth.hasRole('admin', 'Customer'), controller.getLoationByFloorId);
router.get('/getLocationbyName/:name', auth.hasRole('admin', 'Customer'), controller.searchbyName);
router.get('/floor_id/:id', auth.hasRole('admin', 'Customer'), controller.show);
router.get('/get_order/building_id/:id', auth.hasRole('admin', 'Customer'), controller.getFloorOdersBybuildingId);
router.get('/building_id/:id', auth.hasRole('admin', 'Customer'), controller.building_show);
router.delete('/:id', auth.hasRole('admin', 'Customer'), controller.destroy);
router.post('/upload', auth.hasRole('admin', 'Customer'), controller.upload);
router.get('/download', auth.hasRole('admin', 'Customer'), controller.download);

module.exports = router;
