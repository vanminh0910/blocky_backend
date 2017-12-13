'use strict';

const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');

module.exports.listByUser = (event, context, callback) => {

  const ownerId = event.requestContext.authorizer.principalId;
  var params = {
    TableName: process.env.RULES_TABLE_NAME,
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
    callback(null, utils.createResponse(200, null, result.Items));
  });
};