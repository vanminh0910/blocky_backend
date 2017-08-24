'use strict';

const uuid = require('uuid');
const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');

module.exports.create = (event, context, callback) => {
  
  const timestamp = new Date().getTime();
  var input = JSON.parse(event.body);
  const userId = event.requestContext.authorizer.principalId;
  if (!input.topic) {
    callback(null, utils.createResponse(400, 'Invalid topic name '));
    return;
  }

  var params = {
    TableName: process.env.MESSAGES_TABLE_NAME,
    Item: utils.filterBlankAttributes( {
      userId: userId,
      topic: input.topic,
      data : input.data,
      clientId : input.chipId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }),
  };

  dynamodb.put(params, (error) => {
    if (error) {
      console.error(error);
      callback(null, utils.createResponse(500));
      return;
    }

    callback(null, utils.createResponse(200, null, params.Item));
  });
};

