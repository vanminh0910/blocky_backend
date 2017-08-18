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

module.exports.list = (event, context, callback) => {
  const ownerId = event.requestContext.authorizer.principalId;
  var params = {
    TableName: process.env.SCRIPTS_TABLE_NAME,
    KeyConditionExpression: "#ownersub = :a",
    ExpressionAttributeNames:{
      "#ownersub": "ownerId"
      },
    ExpressionAttributeValues: {
    ":a":ownerId,
    }
  };
  // list scripts from the database by userId
  dynamodb.query(params, (error, result) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(null, utils.createResponse(500, 'Please enter valid new name , new lua , new XML'));   
      return;
    }
    // create a response
    callback(null, utils.createResponse(200,null,result.Items));
  });
};