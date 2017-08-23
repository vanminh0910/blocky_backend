'use strict';

const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');
var _ = require('underscore');
const constants = require('../lib/constants');

module.exports.updateStatus = (event, context, callback) => {

  const input = JSON.parse(event.body);
  const params = {
    TableName: process.env.DEVICES_TABLE_NAME,
    IndexName: 'DevicesChipIdIndex',
    KeyConditionExpression: 'chipId = :chipId',
    ExpressionAttributeValues: { ':chipId': input.chipId }
  };

  dynamodb.query(params, function (err, result) {
    if (err) {
      console.log(err);
      callback(null, utils.createResponse(500, 'An internal server error occurred'));
      return;
    }
    var attributeUpdates = utils.toAttributeUpdates({
      status: constants.STATUS_OFFLINE,
      updatedAt: new Date().getTime()
    });
    var result = JSON.stringify(result.Items);
    var result = result.slice(1,result.length-1);
    var result = JSON.parse(result);
     
    dynamodb.update({
      TableName: process.env.DEVICES_TABLE_NAME,
      AttributeUpdates: attributeUpdates,
      Key: {
        id: result.id,
        ownerId: result.ownerId
      },
      ReturnValues: 'ALL_NEW'
    }, (error, result) => {
      if (error) {
        console.error(error);
        callback(null, utils.createResponse(500, 'An internal server error occurred'));
        return;
      }

      callback(null, utils.createResponse(200, null, result.Attributes));
    });
  });
}