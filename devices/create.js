'use strict';

const uuid = require('uuid');
const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');
const constants = require('../lib/constants');

module.exports.create = (event, context, callback) => {
  const timestamp = new Date().getTime();
  var input = JSON.parse(event.body);
  const userId = event.requestContext.authorizer.principalId;
  
  if (!input.name) {
    callback(null, utils.createResponse(400, 'Invalid device name'));
    return;
  }

  if (input.status != constants.STATUS_ONLINE) {
    input.status = constants.STATUS_OFFLINE;
  }

  var params = {
    TableName: process.env.DEVICES_TABLE_NAME,
    Item: {
      id: uuid.v1(),
      chipId : input.chipId,
      name: input.name,
      status : input.status,
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

    callback(null, utils.createResponse(200, null, params.Item ));
  });
};