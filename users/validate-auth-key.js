'use strict';

const uuid = require('uuid');
const shortid = require('shortid');
const validator = require('validator');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const config = require('../lib/config');
const constants = require('../lib/constants');
const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');

module.exports.validateAuthKey = (event, context, callback) => {

  const input = JSON.parse(event.body);

  if (!input.authKey) {
    callback(null, utils.createResponse(400, 'Invalid authentication key'));
    return;
  }

  const params = {
    TableName: process.env.USERS_TABLE_NAME,
    IndexName: 'UsersAuthKeyIndex',
    KeyConditionExpression: 'authKey = :authKey',
    ExpressionAttributeValues: {':authKey': input.authKey}
  };

  dynamodb.query(params, function(err, result) {
    if (err) {
      console.log(err);
      callback(null, utils.createResponse(500, 'An internal server error occurred'));
      return;
    } else if (result.Count != 1) {
      callback(null, utils.createResponse(404, 'Authentication key not found'));
    } else {
      callback(null, utils.createResponse(200));
    }
  });
};
