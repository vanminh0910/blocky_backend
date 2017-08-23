'use strict';

const uuid = require('uuid');
const shortid = require('shortid');
const validator = require('validator');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const _ = require('underscore');
const config = require('../lib/config');
const constants = require('../lib/constants');
const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');

module.exports.changeProfile = (event, context, callback) => {

  const userId = event.requestContext.authorizer.principalId;

  var input = JSON.parse(event.body);

  if (!input.id || input.id != userId) {
    callback(null, utils.createResponse(403, 'Forbidden'));
    return;
  } else if (!input.name || !input.language
    || !validator.isEmail(input.email)) {
    callback(null, utils.createResponse(400, 'Invalid data'));
    return;
  }

  var attributeUpdates = utils.toAttributeUpdates({
    name: input.name,
    language: input.language,
    updatedAt: new Date().getTime()
  });

  dynamodb.update({
    TableName: process.env.USERS_TABLE_NAME,
    AttributeUpdates: attributeUpdates,
    Key: {
      id: userId
    },
    ReturnValues: 'ALL_NEW'
  }, (error, result) => {
    if (error) {
      console.error(error);
      callback(null, utils.createResponse(500, 'An internal server error occurred'));
      return;
    }

    result.Attributes.password = '';

    callback(null, utils.createResponse(200, null, {
      token: utils.generateToken(result.Attributes), 
      user: result.Attributes
    }));
  });  
};
