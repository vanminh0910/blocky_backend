'use strict';

const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');

module.exports.getProfile = (event, context, callback) => {

  const userId = event.requestContext.authorizer.principalId;

  const getParams = {
    TableName: process.env.USERS_TABLE_NAME,
    Key: {
      id: userId,
    },
  };

  dynamodb.get(getParams, (error, result) => {
    if (error) {
      console.error(error);
      callback(null, utils.createResponse(500));
      return;
    }

    if (!result.Item) {
      callback(null, utils.createResponse(500));
    }

    result.Item.password = '';

    callback(null, utils.createResponse(200, null, result.Item));
  });
};
