'use strict';

const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');
var _ = require('underscore');

module.exports.update = (event, context, callback) => {

  const timestamp = new Date().getTime();
  const input = JSON.parse(event.body);
  const userId = event.requestContext.authorizer.principalId;
  if (!input.name) {
    callback(null, utils.createResponse(400, 'Invalid device data'));
    return;
  }

  const getParams = {
    TableName: process.env.DEVICES_TABLE_NAME,
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
      callback(null, utils.createResponse(400, 'Device not exist'));
      return;
    }

    var attributeUpdates = utils.toAttributeUpdates({
      name: input.name,
      updatedAt: new Date().getTime()
    });

    dynamodb.update({
    TableName: process.env.DEVICES_TABLE_NAME,
    AttributeUpdates: attributeUpdates,
    Key: {
      id: event.pathParameters.id,
      ownerId: userId
    },
    ReturnValues: 'ALL_NEW'
  }, (error, result) => {
    if (error) {
      console.error(error);
      callback(null, utils.createResponse(500, 'An internal server error occurred'));
      return;
    }

    callback(null, utils.createResponse(200, null, result.Attributes ));
  });  
  });
}