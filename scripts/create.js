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

module.exports.create = (event, context, callback) => {
  const timestamp = new Date().getTime();
  var input = JSON.parse(event.body);
  const userId = event.requestContext.authorizer.principalId;
  
  if (!input.name ) {
    callback(null, utils.createResponse(400, 'Invalid script data'));
    return;
  }

  var params = {
    TableName: process.env.SCRIPTS_TABLE_NAME,
    Item: {
      id: uuid.v1(),
      name: input.name,
      xml: input.xml,
      lua: input.lua,
      ownerId: userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };

  dynamodb.put(params, (error) => {
    if (error) {
      console.error(error);
      callback(null, utils.createResponse(500, 'An internal server error occurred'));
      return;
    }

    callback(null, utils.createResponse(200,null, params.Item
    ));
  });
};
