'use strict';

const uuid = require('uuid');
const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');
const constants = require('../lib/constants');
const handleDeviceRegistration = require('../devices/handle-device-registration').handleDeviceRegistration;

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

      if (input.topic == 'register') {
        try {
          var deviceData = JSON.parse(input.data);
        } catch(e) {
          console.log('Invalid device data', e);
          callback(null, utils.createResponse(400, 'Invalid device data'));
          return;
        }

        handleDeviceRegistration(user.id, deviceData, function(error, result) {
          if (error) {
            console.log(err);
            callback(null, utils.createResponse(500));
          } else {
            callback(null, utils.createResponse(200, null, result));
          }          
        });

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

