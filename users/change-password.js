'use strict';

const uuid = require('uuid');
const validator = require('validator');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const config = require('../lib/config');
const constants = require('../lib/constants');
const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');

module.exports.changePassword = (event, context, callback) => {

  const userId = event.requestContext.authorizer.principalId;
  const input = JSON.parse(event.body);

  if (!input.password || !input.newPassword) {
    callback(null, utils.createResponse(400, 'Please enter a valid password'));
    return;
  }

  const getParams = {
    TableName: process.env.USERS_TABLE_NAME,
    Key: {
      id: userId,
    },
  };

  dynamodb.get(getParams, (error, result) => {
    if (error) {
      console.error(error);
      callback(null, utils.createResponse(500, 'An internal server error occurred'));
      return;
    }

    const isValidUser = result.Item && bcrypt.compareSync(input.password, result.Item.password);
    if (!isValidUser) {
      callback(null, utils.createResponse(400, 'Please enter a valid password'));
      return;
    }

    const updateParams = {
      TableName: process.env.USERS_TABLE_NAME,
      Key: {
        id: userId,
      },
      ExpressionAttributeNames: {
        '#password': 'password',
      },
      ExpressionAttributeValues: {
        ':newPassword': bcrypt.hashSync(input.newPassword),
        ':updatedAt': new Date().getTime(),
      },
      UpdateExpression: 'SET #password = :newPassword, updatedAt = :updatedAt',
      ReturnValues: 'NONE',
    };

    dynamodb.update(updateParams, (error, result) => {
      if (error) {
        console.error(error);
        callback(null, utils.createResponse(500, 'An internal server error occurred'));
        return;
      }

      callback(null, utils.createResponse(200, null, {}));
    });
  });
};
