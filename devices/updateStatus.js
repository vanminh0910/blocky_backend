'use strict';

var _ = require('underscore');
const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');
const constants = require('../lib/constants');

module.exports.updateStatus = (event, context, callback) => {

  const input = JSON.parse(event.body);

  if (!input.chipId || (input.status != constants.STATUS_OFFLINE
       && input.status != constants.STATUS_ONLINE) ) {
    callback(null, utils.createResponse(400, 'Invalid device data'));
    return;
  }
  
  const params = {
    TableName: process.env.DEVICES_TABLE_NAME,
    IndexName: 'DevicesChipIdIndex',
    KeyConditionExpression: 'chipId = :chipId',
    ExpressionAttributeValues: { ':chipId': input.chipId }
  };  

  dynamodb.query(params, function (err, result) {
    if (err) {
      console.log(err);
      callback(null, utils.createResponse(500));
      return;
    }

    if (result.Count != 1) {
      callback(null, utils.createResponse(500));
      return;
    }

    var attributeUpdates = utils.toAttributeUpdates({
      status: input.status,
      updatedAt: new Date().getTime()
    });    
 
    var device = result.Items[0];
    
    dynamodb.update({
      TableName: process.env.DEVICES_TABLE_NAME,
      AttributeUpdates: attributeUpdates,
      Key: {
        id: device.id,
        ownerId: device.ownerId
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