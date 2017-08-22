'use strict';

const constants = require('../lib/constants');
const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');

module.exports.get = (event, context, callback) => {

  const userId = event.requestContext.authorizer.principalId;

  const params = {
    TableName: process.env.DEVICES_TABLE_NAME,
    Key: {
      id: event.pathParameters.id,
      ownerId: userId
    },
  };

  dynamodb.get(params, (error, result) => {
    if (error) {
      console.error(error);
      callback(null, utils.createResponse(500));
      return;
    }

    callback(null, utils.createResponse(200, null, result.Item));
  });
};
