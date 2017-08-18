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

module.exports.update = (event, context, callback) => {
  const timestamp = new Date().getTime();
  const input = JSON.parse(event.body);
  const userId = event.requestContext.authorizer.principalId;
  if (!input.newName || !input.newLua ||!input.newXml) {
    callback(null, utils.createResponse(400, 'Please enter valid new name , new lua , new XML'));
    return;
  }

  const getParams = {
    TableName: process.env.SCRIPTS_TABLE_NAME,
    Key: {
      id: event.pathParameters.id,
      ownerId: userId,
    }
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
    const updateParams = {
      TableName: process.env.SCRIPTS_TABLE_NAME,
      Key: {
        id: event.pathParameters.id,
        ownerId: userId,
      },
      ExpressionAttributeNames: {
        '#name': 'name',
        '#xml': 'xml',
        '#lua': 'lua'
      },
      ExpressionAttributeValues: {
        ':newName': input.newName,
        ':newXml': input.newXml,
        ':newLua': input.newLua,
        ':updatedAt': timestamp,
      },
      UpdateExpression: 'SET #name = :newName, #xml = :newXml,#lua =:newLua , updatedAt = :updatedAt',
      ReturnValues: 'ALL_NEW',
    };
    // update the todo in the database
    dynamodb.update(updateParams, (error, result) => {
      // handle potential errors
      if (error) {
        console.error(error);
        callback(new Error('Couldn\'t update the this item.'));
        return;
      }
      // create a response
       callback(null, utils.createResponse(200,null,result ));
    });
  });
}