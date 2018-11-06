'use strict';

import {Router} from 'express';
import * as controller from './country.controller';
import * as auth from '../../auth/auth.service';

var router = new Router();

router.get('/', auth.hasRole('admin', 'Customer'), controller.index);
router.get('/:id', auth.hasRole('admin', 'Customer'), controller.show);

module.exports = router;
