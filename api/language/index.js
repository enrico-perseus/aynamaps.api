'use strict';

import {Router} from 'express';
import * as controller from './language.controller';
import * as auth from '../../auth/auth.service';

var router = new Router();

router.post('/', auth.hasRole('admin', 'Admin'), controller.create);
router.get('/', auth.hasRole('user', '*'), controller.index);
router.get('/:id', auth.hasRole('admin', 'Customer'), controller.show);
router.put('/', auth.hasRole('admin', 'Admin'), controller.update);
router.delete('/:id', auth.hasRole('admin', 'Admin'), controller.destroy);
router.get('/:customer_id', auth.hasRole('admin', 'Customer'), controller.index);
router.get('/:id/:customer_id', auth.hasRole('admin', 'Customer'), controller.show);

module.exports = router;
