'use strict';

const uuid = require('uuid');
const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');
const constants = require('../lib/constants');
const handleDeviceRegistration = require('../devices/handle-device-registration').handleDeviceRegistration;
const handleDeviceOffline = require('../devices/handle-device-offline').handleDeviceOffline;
const handleRuleEvents = require('../rules/handle-rule-events').handleRuleEvents;

function findUserByAuthKey(authKey, callback) {
  // lookup auth key to find user
  var params = {
    TableName: process.env.USERS_TABLE_NAME,
    IndexName: 'UsersAuthKeyIndex',
    KeyConditionExpression: 'authKey = :authKey',
    ExpressionAttributeValues: {':authKey': authKey}
  };

  dynamodb.query(params, function(err, result) {
    if (err) {
      console.log(err);
      callback(err, null);
      return;

    } else if (result.Count != 1) {      
      callback('Authentication key not found', null);
      return;
    }

    callback(null, result.Items[0]);
  });  
}

module.exports.process = (event, context, callback) => {
  
  const timestamp = new Date().getTime();
  var input = JSON.parse(event.body);

  if (!input.topic || !input.authKey) {
    callback(null, utils.createResponse(400, 'Invalid message data'));
    return;
  }

  if (input.topic == input.authKey + '/sys/') { //handle system message
    var payload = JSON.parse(input.data);
    if (payload.event == 'register') {      
      findUserByAuthKey(input.authKey, function(err, foundUser) {
        if (err) {
          callback(null, utils.createResponse(404, 'Authentication key not found'));
        } else {
          handleRuleEvents(foundUser.id, payload, function(error, result) {
            if (error) {
              console.log(err);
            }
          });

          handleDeviceRegistration(foundUser.id, payload, function(error, result) {
            if (error) {
              console.log(err);
              callback(null, utils.createResponse(500));
            } else {
              callback(null, utils.createResponse(200, null, result));
            }
          });
          return;
        }
      })
      return;
    } else if (payload.event == 'offline') {
      var payload = JSON.parse(input.data);
      findUserByAuthKey(input.authKey, function(err, foundUser) {
        if (err) {
          callback(null, utils.createResponse(404, 'Authentication key not found'));
        } else {
          handleRuleEvents(foundUser.id, payload, function(error, result) {
            if (error) {
              console.log(err);
            }
          });
          handleDeviceOffline(foundUser.id, payload, function(error, result) {
            if (error) {
              console.log(err);
              callback(null, utils.createResponse(500));
            } else {
              callback(null, utils.createResponse(200, null, result));
            }          
          });

          return;
        }
      })
    } else {
      callback(null, utils.createResponse(200));
      return;
    }
  } else if (input.topic.startsWith(input.authKey + '/user/')) { //handle user message
    var parsedTopic = input.topic.replace(input.authKey + '/user/', '');
    findUserByAuthKey(input.authKey, function(err, foundUser) {
      if (err) {
        callback(null, utils.createResponse(404, 'Authentication key not found'));
        return;
      } else {
        var payload = {
          topic: parsedTopic,
          message: input.data
        };
        handleRuleEvents(foundUser.id, payload, function(error, result) {
          if (error) {
            console.log(err);
          }
        });
        
        var params = {
          TableName: process.env.MESSAGES_TABLE_NAME,
          Item: {
            userIdTopic: foundUser.id + '_' + parsedTopic,
            userId: foundUser.id,
            topic: parsedTopic,
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
        return;
      }
    })
  } else {
    callback(null, utils.createResponse(200));
  }
};

