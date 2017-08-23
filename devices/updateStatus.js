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
   
  if (!input.chipId  ) {
    callback(null, utils.createResponse(400, 'Please enter valid chipId'));
    return;
  }

  if (input.status != constants.STATUS_OFFLINE
       && input.status != constants.STATUS_ONLINE) {
    callback(null, utils.createResponse(400, 'Please enter valid  status'));
    return;
  }

  dynamodb.query(params, function (err, result) {
    if (err) {
      console.log(err);
      callback(null, utils.createResponse(500));
      return;
    }

    if (_.isEmpty(result)) {
      callback(null, utils.createResponse(400, 'Device not exist'));
      return;
    }

    var attributeUpdates = utils.toAttributeUpdates({
      status: input.status,
      updatedAt: new Date().getTime()
    });

    if (result.Count != 1) {
      callback(null, utils.createResponse(500));
      return;
    }
 
    var item = result.Items[0];
    
    dynamodb.update({
      TableName: process.env.DEVICES_TABLE_NAME,
      AttributeUpdates: attributeUpdates,
      Key: {
        id: item.id,
        ownerId: item.ownerId
      },
      ReturnValues: 'ALL_NEW'
    }, (error, result) => {
      if (error) {
        console.error(error);
        callback(null, utils.createResponse(500));
        return;
      }

      callback(null, utils.createResponse(200, null, result.Attributes));
    });
  });
}