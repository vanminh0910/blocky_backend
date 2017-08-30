'use strict';

const uuid = require('uuid');
const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');
const constants = require('../lib/constants');

function addUpdateDevice(userId, deviceData, callback) {
  const params = {
    TableName: process.env.DEVICES_TABLE_NAME,
    IndexName: 'DevicesChipIdIndex',
    KeyConditionExpression: 'chipId = :chipId',
    ExpressionAttributeValues: { ':chipId': deviceData.chipId.toString() }
  };  

  dynamodb.query(params, function (err, result) {
    if (err) {
      console.log(err);
      callback(null, utils.createResponse(500));
      return;
    }

    if (result.Count == 0) {
      // create new device
      if (!deviceData.chipId) {
        console.log('Cannot add new device due to invalid data');
        callback(null, utils.createResponse(400, 'Invalid device data'));
        return;
      }

      if (!deviceData.name) {
        deviceData.name = 'BLOCKY_' + deviceData.chipId;
      }

      var timestamp = new Date().getTime();

      var params = {
        TableName: process.env.DEVICES_TABLE_NAME,
        Item: {
          id: uuid.v1(),
          chipId : deviceData.chipId.toString(),
          name: deviceData.name,
          status : constants.STATUS_ONLINE,
          ownerId: userId,
          type: deviceData.type,
          fimrware: deviceData.firmware,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      };

      dynamodb.put(params, (error) => {
        if (error) {
          console.error(error);
          callback(null, utils.createResponse(500));
          return;
        }

        console.log('Update device status to Online successfully');
        callback(null, utils.createResponse(200, null, params.Item));
      });
      return;
    } else if (result.Count == 1) {
      // device exists, update status to online
      var attributeUpdates = utils.toAttributeUpdates({
        status: constants.STATUS_ONLINE,
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

    }    
  });
}

module.exports.create = (event, context, callback) => {
  
  const timestamp = new Date().getTime();
  var input = JSON.parse(event.body);

  if (!input.topic || !input.authKey) {
    callback(null, utils.createResponse(400, 'Invalid message data'));
    return;
  }

  // lookup auth key to find user
  var params = {
    TableName: process.env.USERS_TABLE_NAME,
    IndexName: 'UsersAuthKeyIndex',
    KeyConditionExpression: 'authKey = :authKey',
    ExpressionAttributeValues: {':authKey': input.authKey}
  };

  dynamodb.query(params, function(err, result) {
    if (err) {
      console.log(err);
      callback(null, utils.createResponse(500));
      return;
    } else if (result.Count != 1) {
      callback(null, utils.createResponse(404, 'Authentication key not found'));
    } else {
      var user = result.Items[0];

      if (input.topic == '/register') {
        try {
          var deviceData = JSON.parse(input.data);
        } catch(e) {
          console.log('Invalid device data', e);
          callback(null, utils.createResponse(400, 'Invalid device data'));
        }
        addUpdateDevice(user.id, deviceData, callback);
        return;
      }

      var params = {
        TableName: process.env.MESSAGES_TABLE_NAME,
        Item: {
          userIdTopic: user.id + '_' + input.topic,
          userId: user.id,
          topic: input.topic,
          data : input.data || ' ',
          createdAt: timestamp
        },
      };

      dynamodb.put(params, (error) => {
        if (error) {
          console.error(error);
          callback(null, utils.createResponse(500));
          return;
        }

        callback(null, utils.createResponse(200, null, params.Item));
      });  
    }
  });
};

