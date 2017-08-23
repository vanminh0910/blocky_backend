'use strict';

const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');
var _ = require('underscore');

module.exports.update = (event, context, callback) => {

  const timestamp = new Date().getTime();
  const input = JSON.parse(event.body);
  const userId = event.requestContext.authorizer.principalId;
  if (!input.name) {
    callback(null, utils.createResponse(400, 'Invalid dashboard data'));
    return;
  }

  const getParams = {
    TableName: process.env.DASHBOARDS_TABLE_NAME,
    Key: {
      id: event.pathParameters.id,
      ownerId: userId,
    }
  };

  dynamodb.get(getParams, (error, result) => {
    if (error) {
      console.error(error);
      callback(null, utils.createResponse(500, 'An internal server error occurred '));
      return;
    }

    if (_.isEmpty(result)) {
      callback(null, utils.createResponse(400, 'Dashboard not exist'));
      return;
    }

    var attributeUpdates = utils.toAttributeUpdates({
      name: input.name,
      content: input.content,
      updatedAt: new Date().getTime()
    });

    dynamodb.update({
      TableName: process.env.DASHBOARDS_TABLE_NAME,
      AttributeUpdates: attributeUpdates,
      Key: {
        id: event.pathParameters.id,
        ownerId: userId
      },
      ReturnValues: 'ALL_NEW'
    }, (error, result) => {
      if (error) {
        console.error(error);
        callback(null, utils.createResponse(500));
        return;
      }

      callback(null, utils.createResponse(200, null, result.Attributes ));
    });  
  });
}