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

module.exports.changeAuthKey = (event, context, callback) => {

  const userId = event.requestContext.authorizer.principalId;

  var attributeUpdates = utils.toAttributeUpdates({
      authKey: shortid.generate(),
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

    callback(null, utils.createResponse(200, null, {authKey: result.Attributes.authKey}));
  });  
};
