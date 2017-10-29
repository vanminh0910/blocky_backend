'use strict';

const bcrypt = require('bcrypt-nodejs');
const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');
const config = require('../lib/config');

module.exports.resetPassword = (event, context, callback) => {

  const input = JSON.parse(event.body);
  if (!input.token) {
    callback(null, utils.createResponse(400, 'Password reset token is invalid or has expired'));
    return;
  }

  if (!input.newPassword) {
    callback(null, utils.createResponse(400, 'Please enter a valid password'));
    return;
  }

  const params = {
    TableName: process.env.USERS_TABLE_NAME,
    IndexName: 'UsersResetTokenIndex',
    KeyConditionExpression: 'resetToken = :resetToken',
    ExpressionAttributeValues: {
      ':resetToken': input.token
    }
  };

  dynamodb.query(params, (error, result) => {
    if (error) {
      console.error(error);
      callback(null, utils.createResponse(500, 'An internal server error occurred'));
      return;
    }

    if (result.Count != 1 || result.Items[0].resetTokenExpiry < new Date().getTime()) {
      callback(null, utils.createResponse(400, 'Password reset token is invalid or has expired'));
      return;
    } else {
      const user = result.Items[0];
      const updateParams = {
        TableName: process.env.USERS_TABLE_NAME,
        Key: {
          id: user.id,
        },
        ExpressionAttributeNames: {
          '#password': 'password',
        },
        ExpressionAttributeValues: {
          ':newPassword': bcrypt.hashSync(input.newPassword),
          ':updatedAt': new Date().getTime(),
          ':resetTokenExpiry': 0
        },
        UpdateExpression: 'SET #password = :newPassword, updatedAt = :updatedAt, resetTokenExpiry = :resetTokenExpiry',
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
          template: 'reset-password-email',
          subject: 'Blocky - Password Reset Confirmation',
          context: {
            name: user.name,
            webAppUrl: config.webAppUrl
          }
        };
        utils.sendMail(mailOptions);

        user.password = '';
        callback(null, utils.createResponse(200, null, {
          token: utils.generateToken(user),
          user: user
        }));
        return;
      });
    }
  });
};