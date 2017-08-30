'use strict';

const constants = require('../lib/constants');
const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');
const getDashboardData = require('./get-dashboard-data').getDashboardData;

module.exports.get = (event, context, callback) => {

  const userId = event.requestContext.authorizer.principalId;

  const params = {
    TableName: process.env.DASHBOARDS_TABLE_NAME,
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
