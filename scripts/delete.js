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

module.exports.delete = (event, context, callback) => {
    console.log(event);
  const timestamp = new Date().getTime();
  const email = event.requestContext.authorizer.principalId;
  const getParams = {
    TableName: process.env.SCRIPTS_TABLE_NAME,
    Key: {
      id: event.pathParameters.id,
      ownerId: email,
    },
  };
  dynamodb.get(getParams, (error, result) => {
    if (error) {
      console.error(error);
      callback(null, utils.createResponse(500, 'Internal Server Error.'));
      return;
    }
    if (utils.isEmpty(result)) {
      callback(null, utils.createResponse(400, 'Non-existing script'));
        return;
    }
    
    const params = {
      TableName: process.env.SCRIPTS_TABLE_NAME,
      Key: {
        id: event.pathParameters.id,
        ownerId: email,
      },
      ConditionExpression: "id = :idDeleted",
      ExpressionAttributeValues: {
        ":idDeleted": event.pathParameters.id
      },
    };
    // delete the script from the database
    dynamodb.delete(params, (error, result) => {
      // handle potential errors
      if (error) {
         callback(null, utils.createResponse(500, 'An internal server error occurred'));
        return;
      }
      // create a response
      callback(null, utils.createResponse(500, 'Deleted successfully'));
    });
  });
};