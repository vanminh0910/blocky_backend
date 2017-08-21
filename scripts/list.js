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

module.exports.listByUser = (event, context, callback) => {
  
  const ownerId = event.requestContext.authorizer.principalId;
  var params = {
    TableName: process.env.SCRIPTS_TABLE_NAME,
    KeyConditionExpression: "#ownerId = :ownerId",
    ExpressionAttributeNames: {
      "#ownerId": "ownerId"
    },
    ExpressionAttributeValues: {
    ":ownerId": ownerId,
    }
  };

  dynamodb.query(params, (error, result) => {
    if (error) {
      console.error(error);
      callback(null, utils.createResponse(500, 'An internal server error occurred '));   
      return;
    }
    callback(null, utils.createResponse( 200, null, result.Items));
  });
};