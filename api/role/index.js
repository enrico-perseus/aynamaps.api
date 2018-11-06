'use strict';

import {Router} from 'express';
import * as controller from './role.controller';
import * as auth from '../../auth/auth.service';

var router = new Router();


router.post('/', auth.hasRole('admin', 'Customer'), controller.create);
router.get('/', auth.hasRole('admin', 'Customer'), controller.me);
router.get('/name/:name', auth.hasRole('admin', 'Customer'), controller.findUsingbyName);
router.get('/:id', auth.hasRole('admin', 'Customer'), controller.show);
router.put('/', auth.hasRole('admin', 'Customer'), controller.update);
router.delete('/:id', auth.hasRole('admin', 'Customer'), controller.destroy);

module.exports = router;
