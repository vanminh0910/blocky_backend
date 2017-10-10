'use strict';

const uuid = require('uuid');
const constants = require('../lib/constants');
const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');

module.exports.handleDeviceOffline = (userId, deviceData, callback) => {

  if (!userId || !deviceData.chipId) {
    console.log('Invalid device data');
    callback(new Error('Invalid device data'), null);
    return;
  }

  const params = {
    TableName: process.env.DEVICES_TABLE_NAME,
    IndexName: 'DevicesChipIdOwnerIdIndex',
    KeyConditionExpression: 'ownerId = :ownerId and chipId = :chipId',
    ExpressionAttributeValues: { 
      ':ownerId': userId,
      ':chipId': deviceData.chipId.toString()
    },
  };

  dynamodb.query(params, (error, result) => {
    if (error) {
      console.error(error);
      callback(error, null);
      return;
    }

    if (result && result.Count > 0) {
      // device exists, update status to offline
      var attributeUpdates = utils.toAttributeUpdates({
        status: constants.STATUS_OFFLINE,
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
          callback(error, null);
          return;
        }

        callback(null, result.Attributes);
      });
    } else {
      console.log('Device not exist');
      callback(new Error('Device not exist'), null);
      return;
    }
  });
}