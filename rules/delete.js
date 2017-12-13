'use strict';

const uuid = require('uuid');
const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');
var _ = require('underscore');

module.exports.delete = (event, context, callback) => {

  const timestamp = new Date().getTime();
  const userId = event.requestContext.authorizer.principalId;
  const getParams = {
    TableName: process.env.RULES_TABLE_NAME,
    Key: {
      id: event.pathParameters.id,
      ownerId: userId,
    },
  };

  dynamodb.get(getParams, (error, result) => {
    if (error) {
      console.error(error);
      callback(null, utils.createResponse(500, 'Internal Server Error.'));
      return;
    }

    if (_.isEmpty(result)) {
      callback(null, utils.createResponse(400, 'Rule not exist'));
      return;
    }

    const params = {
      TableName: process.env.RULES_TABLE_NAME,
      Key: {
        id: event.pathParameters.id,
        ownerId: userId,
      },
      ConditionExpression: "id = :deletedRuleId",
      ExpressionAttributeValues: {
        ":deletedRuleId": event.pathParameters.id
      },
    };

    dynamodb.delete(params, (error, result) => {
      if (error) {
        callback(null, utils.createResponse(500, 'An internal server error occurred'));
        return;
      }

      callback(null, utils.createResponse(200));
    });
  });
};