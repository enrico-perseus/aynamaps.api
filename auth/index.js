'use strict';
import express from 'express';
import config from '../config/environment';
import User from '../api/user/user.model';
import Customer from '../api/customer/customer.model';

// Passport Configuration
require('./local/passport').setup(User, Customer, config);

var router = express.Router();

router.use('/local', require('./local').default);

export default router;
