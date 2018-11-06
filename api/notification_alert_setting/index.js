'use strict';

import {Router} from 'express';
import * as controller from './notification_alert_setting.controller';
import * as auth from '../../auth/auth.service';

var router = new Router();

router.post('/', auth.hasRole('admin', 'Customer'), controller.create);
/* router.get('/me', auth.hasRole('admin', 'Customer'),  controller.me); */
router.put('/', auth.hasRole('admin', 'Customer'), controller.update);
/* router.get('/', auth.hasRole('admin', 'Customer'), controller.index); */
router.get('/:id', auth.hasRole('admin', 'Customer'), controller.show);
/* router.delete('/:id', auth.hasRole('admin', 'Customer'), controller.destroy); */

module.exports = router;
