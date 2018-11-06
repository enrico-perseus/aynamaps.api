'use strict';

import nodeMailer from 'nodemailer';

import config from '../../config/environment';

export function send_mail(mailOption, callback) {
  let transporter = nodeMailer.createTransport(config.mailOption);
  transporter.sendMail(mailOption, function (error, info) {
    callback(error, info);
  });
}
