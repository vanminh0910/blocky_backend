'use strict';

var _ = require('underscore');
const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');
const getDashboardData = require('./get-dashboard-data').getDashboardData;

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
      callback(null, utils.createResponse(500));
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

    console.log(attributeUpdates);

    dynamodb.update({
      TableName: process.env.DASHBOARDS_TABLE_NAME,
      AttributeUpdates: attributeUpdates,
      Key: {
        id: event.pathParameters.id,
        ownerId: userId
      },
      ReturnValues: 'ALL_NEW'
    }, (error, dashboard) => {
      if (error) {
        console.error(error);
        callback(null, utils.createResponse(500));
        return;
      }

      if (input.subscribedTopics) {
        attributeUpdates = utils.toAttributeUpdates({
          subscribedTopics: JSON.stringify(input.subscribedTopics),
          updatedAt: new Date().getTime()
        });
      } else {
        attributeUpdates = utils.toAttributeUpdates({
          subscribedTopics: '[]',
          updatedAt: new Date().getTime()
        });
      }
  
      dynamodb.update({
        TableName: process.env.USERS_TABLE_NAME,
        AttributeUpdates: attributeUpdates,
        Key: {
          id: userId
        },
        ReturnValues: 'ALL_NEW'
      }, (error, result) => {
        if (error) {
          console.error(error);
          callback(null, utils.createResponse(500));
          return;
        }
        // get dashboard data
        getDashboardData(userId, input.subscribedTopics, function(error, data) {
          if (error) {
            console.error(error);
            callback(null, utils.createResponse(500));
            return;
          }

          callback(null, utils.createResponse(200, null, 
          {
            dashboard: dashboard.Attributes,
            data: data
          }));
        });
      }); 
    });  
  });
}