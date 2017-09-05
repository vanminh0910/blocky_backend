'use strict';

const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');
const getDashboardData = require('./get-dashboard-data').getDashboardData;

module.exports.listByUser = (event, context, callback) => {
  const userId = event.requestContext.authorizer.principalId;
  var params = {
    TableName: process.env.DASHBOARDS_TABLE_NAME,
    KeyConditionExpression: "#ownerId = :ownerId",
    ExpressionAttributeNames:{
      "#ownerId": "ownerId"
    },
    ExpressionAttributeValues: {
    ":ownerId": userId,
    }
  };

  dynamodb.query(params, (error, dashboards) => {
    if (error) {
      console.error(error);
      callback(null, utils.createResponse(500));   
      return;
    }

    const getUserParams = {
      TableName: process.env.USERS_TABLE_NAME,
      Key: {
        id: userId,
      },
    };
  
    dynamodb.get(getUserParams, (error, result) => {
      if (error) {
        console.error(error);
        callback(null, utils.createResponse(500));
        return;
      }
  
      if (!result.Item) {
        callback(null, utils.createResponse(400, 'Invalid user'));
        return;
      }

      var subscribedTopics = null;

      try {
        console.log(result.Item.subscribedTopics);
        subscribedTopics = JSON.parse(result.Item.subscribedTopics);
      } catch(e) {
        console.log('Error parsing user subscribed topics.');
        console.log(e);
        callback(null, utils.createResponse(200, null, 
          {
            dashboards: dashboards.Items,
            data: ''
          }));
        return;
      }      
  
      // get dashboard data
      getDashboardData(userId, subscribedTopics, function(error, data) {
        if (error) {
          console.error(error);
          callback(null, utils.createResponse(500));
          return;
        }

        callback(null, utils.createResponse(200, null, 
        {
          dashboards: dashboards.Items,
          data: data
        }));
      });  
    });  
  });
};