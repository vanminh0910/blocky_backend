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


module.exports.signup = (event, context, callback) => {
  var input = JSON.parse(event.body);
  if (!input.email || !input.password || !validator.isEmail(input.email)) {
    callback(null, utils.createResponse(400, 'Please enter valid email and password'));
    return;
  }
  // check if email already exists
  var params = {
    TableName: process.env.USERS_TABLE_NAME,
    IndexName: 'UsersEmailIndex',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: {':email': input.email}
  };

  dynamodb.query(params, function(err, data) {
    if (err) {
      console.log(err);
      callback(null, utils.createResponse(500, 'An internal server error occurred'));
      return;
    } else {
      if (data.Count > 0) {
        callback(null, utils.createResponse(400, 'Email address already exists'));
        return;
      } else {
        const timestamp = new Date().getTime();

        var params = {
          TableName: process.env.USERS_TABLE_NAME,
          Item: {
            id: uuid.v1(),
            name: input.name,
            email: input.email,
            password: bcrypt.hashSync(input.password),
            authKey : shortid.generate(),
            activated: true,
            role: constants.ROLE_BROKER,
            language: 'en',
            createdAt: timestamp,
            updatedAt: timestamp,
          },
          ConditionExpression: "attribute_not_exists(email)",
        };

        dynamodb.put(params, (error) => {
          if (error) {
            console.error(error);
            callback(null, utils.createResponse(500, 'An internal server error occurred'));
            return;
          }

          params.Item.password = ''; // Filter sensitive data

          callback(null, utils.createResponse(200, null, {
            token: utils.generateToken(params.Item), 
            user: params.Item
          }));
        });
      }
    }
  });
};