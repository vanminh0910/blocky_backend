'use strict';

const uuid = require('uuid');
const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');

module.exports.create = (event, context, callback) => {
  const timestamp = new Date().getTime();
  var input = JSON.parse(event.body);
  const userId = event.requestContext.authorizer.principalId;

  if (!input.name) {
    callback(null, utils.createResponse(400, 'Invalid rule data'));
    return;
  }

  var params = {
    TableName: process.env.RULES_TABLE_NAME,
    Item: utils.filterBlankAttributes({
      id: uuid.v1(),
      name: input.name,
      status: input.status,
      xml: input.xml,
      triggers: input.triggers,
      actions: input.actions,
      ownerId: userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }),
  };

  dynamodb.put(params, (error, result) => {
    if (error) {
      console.error(error);
      callback(null, utils.createResponse(500, 'An internal server error occurred'));
      return;
    }

    callback(null, utils.createResponse(200, null, params.Item));
  });
};