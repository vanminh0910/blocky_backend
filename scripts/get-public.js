'use strict';

const constants = require('../lib/constants');
const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');

module.exports.getPublic = (event, context, callback) => {
  const params = {
    TableName: process.env.SCRIPTS_TABLE_NAME,
    IndexName: 'ScriptsIdIndex',
    KeyConditionExpression: 'id = :id',
    ExpressionAttributeValues: { 
        ':id': event.pathParameters.id
    },
  };

  dynamodb.query(params, (error, result) => {
    if (error) {
      console.error(error);
      callback(null, utils.createResponse(500, 'An internal server error occurred'));
      return;
    }

    if (result && result.Count > 0 && result.Items[0].isPublic === 1) {
      callback(null, utils.createResponse(200, null, result.Items[0]));
    } else {
      callback(null, utils.createResponse(404, 'Script not found'));
    }
  });
};
