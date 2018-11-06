'use strict';

import {Router} from 'express';
import * as controller from './customer.controller';
import * as auth from '../../auth/auth.service';

var router = new Router();

router.get('/', auth.hasRole('admin', 'Admin'), controller.index);
router.delete('/:id', auth.hasRole('admin', 'Admin'), controller.destroy);
router.get('/me', auth.isAuthenticated(), controller.me);
router.put('/:id/password', auth.isAuthenticated(), controller.changePassword);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/', auth.hasRole('admin', 'Admin'), controller.create);
router.put('/', auth.hasRole('admin', 'Admin'), controller.update);
router.post('/upload', auth.isAuthenticated(), controller.upload);
router.delete('/:id/delete/:filename', auth.hasRole('admin', 'Admin'), controller.deleteAttachment);
router.post('/sendmail', auth.hasRole('admin', 'Admin'), controller.sendMail);
router.post('/checkconnection', controller.checkConnection);
router.post('/export', auth.hasRole('admin', 'Admin'), controller.exportDB);
router.post('/forgotPassword', controller.forgotPassword);

module.exports = router;
