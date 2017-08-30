'use strict';

var _ = require('underscore');
const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');
const constants = require('../lib/constants');

module.exports.updateStatus = (event, context, callback) => {

  const input = JSON.parse(event.body);

  if (!input.chipId || (input.status != constants.STATUS_OFFLINE
       && input.status != constants.STATUS_ONLINE || !input.authKey) ) {
    callback(null, utils.createResponse(400, 'Invalid device data'));
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

    } 
    
    if (result.Count != 1) {
      
      callback(null, utils.createResponse(404, 'Authentication key not found'));

    } else {
      var user = result.Items[0];

      const params = {
        TableName: process.env.DEVICES_TABLE_NAME,
        IndexName: 'DevicesChipIdOwnerIdIndex',
        IndexName: 'DevicesChipIdOwnerIdIndex',
        KeyConditionExpression: 'ownerId = :ownerId and chipId = :chipId',
        ExpressionAttributeValues: { 
            ':ownerId': user.id,
            ':chipId': input.chipId
        },
      };

      dynamodb.query(params, (error, result) => {
        if (error) {
          console.error(error);
          callback(null, utils.createResponse(500));
          return;
        }

        if (result && result.Count > 0) {
          // device exists, update status to input status
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
              ownerId: user.id
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
        } else {
          callback(null, utils.createResponse(404, 'Device not found'));
        }
      });
    }
  });
}