'use strict';

const validator = require('validator');
const crypto = require('crypto');
const config = require('../lib/config');
const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');

module.exports.forgotPassword = (event, context, callback) => {

  const input = JSON.parse(event.body);
  if (!input.email || !validator.isEmail(input.email)) {
    callback(null, utils.createResponse(400, 'Please enter valid email'));
    return;
  }

  const params = {
    TableName: process.env.USERS_TABLE_NAME,
    IndexName: 'UsersEmailIndex',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': input.email
    }
  };

  dynamodb.query(params, (error, result) => {
    if (error) {
      console.error(error);
      callback(null, utils.createResponse(500, 'An internal server error occurred'));
      return;
    }

    if (result.Count != 1) {
      callback(null, utils.createResponse(400, 'Please enter valid email'));
      return;
    } else {
      const user = result.Items[0];
      crypto.randomBytes(20, function (error, buffer) {
        const token = buffer.toString('hex');
        const updateParams = {
          TableName: process.env.USERS_TABLE_NAME,
          Key: {
            id: user.id,
          },
          ExpressionAttributeValues: {
            ':resetToken': token,
            ':resetTokenExpiry': new Date().getTime() + 3600000,
          },
          UpdateExpression: 'SET resetToken = :resetToken, resetTokenExpiry = :resetTokenExpiry',
          ReturnValues: 'NONE',
        };

        dynamodb.update(updateParams, (error, result) => {
          if (error) {
            console.error(error);
            callback(null, utils.createResponse(500, 'An internal server error occurred'));
            return;
          }

          const mailOptions = {
            to: user.email,
            from: config.emailSender,
            template: 'forgot-password-email',
            subject: 'Blocky - Password reset has been requested',
            context: {
              name: user.name,
              resetUrl: config.webAppUrl + '/#resetPassword?token=' + token,
              webAppUrl: config.webAppUrl
            }
          };
          utils.sendMail(mailOptions);

          callback(null, utils.createResponse(200, null, {}));
          return;
        });
      });
    }
  });
};