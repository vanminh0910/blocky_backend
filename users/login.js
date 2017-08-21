'use strict';

const uuid = require('uuid');
const validator = require('validator');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const config = require('../lib/config');
const constants = require('../lib/constants');
const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');

module.exports.login = (event, context, callback) => {

  console.log(process.env.JWT_SECRET_KEY);

  const input = JSON.parse(event.body);
  if (!input.email || !input.password || !validator.isEmail(input.email)) {
    callback(null, utils.createResponse(400, 'Please enter valid email and password'));
    return;
  }

  const params = {
    TableName: process.env.USERS_TABLE_NAME,
    IndexName: 'UsersEmailIndex',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: {':email': input.email}
  };

  dynamodb.query(params, function(err, result) {
    if (err) {
      console.log(err);
      callback(null, utils.createResponse(500, 'An internal server error occurred'));
      return;
    } 
    
    if (result.Count != 1) {
      callback(null, utils.createResponse(401, 'Authentication failed'));
      return;
    } else {

      var user = result.Items[0];
      
      const isValidUser = user && bcrypt.compareSync(
        input.password, user.password);
      
      if (isValidUser) {
        user.password = '';
        var token = utils.generateToken(user);
                
        callback(null, utils.createResponse(200, null, {
          token: token, 
          user: user
        }));

      } else {
        callback(null, utils.createResponse(401, 'Authentication failed'));
        return;
      }
    }
  });
};
