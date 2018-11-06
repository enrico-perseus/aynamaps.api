'use strict';

import {Router} from 'express';
import * as controller from './user.controller';
import * as auth from '../../auth/auth.service';

var router = new Router();

router.get('/', auth.hasRole('admin', 'Admin'), controller.index);
router.delete('/:id', auth.hasRole('admin', 'Admin'), controller.destroy);
router.get('/me', auth.isAuthenticated(), controller.me);
router.put('/:id/password', auth.isAuthenticated(), controller.changePassword);
router.get('/:id', auth.hasRole('admin', 'Admin'), controller.show);
router.post('/', auth.hasRole('admin', 'Admin'), controller.create);

module.exports = router;
