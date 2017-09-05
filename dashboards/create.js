'use strict';

const uuid = require('uuid');
const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');
const getDashboardData = require('./get-dashboard-data').getDashboardData;

module.exports.create = (event, context, callback) => {
  const timestamp = new Date().getTime();
  var input = JSON.parse(event.body);
  const userId = event.requestContext.authorizer.principalId;
  
  if (!input.name ) {
    callback(null, utils.createResponse(400, 'Invalid dashboard name'));
    return;
  }

  var params = {
    TableName: process.env.DASHBOARDS_TABLE_NAME,
    Item: utils.filterBlankAttributes({
      id: uuid.v1(),
      name: input.name,
      content: input.content,
      ownerId: userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }),
  };

  dynamodb.put(params, (error) => {
    if (error) {
      console.error(error);
      callback(null, utils.createResponse(500, 'An internal server error occurred'));
      return;
    }

    var attributeUpdates = null;

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
          dashboard: params.Item,
          data: data
        }));
      });
    });
  });
};