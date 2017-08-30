'use strict';

const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');
const getDashboardData = require('./get-dashboard-data').getDashboardData;

module.exports.listByUser = (event, context, callback) => {
  const user = event.requestContext.authorizer;
  var params = {
    TableName: process.env.DASHBOARDS_TABLE_NAME,
    KeyConditionExpression: "#ownerId = :ownerId",
    ExpressionAttributeNames:{
      "#ownerId": "ownerId"
    },
    ExpressionAttributeValues: {
    ":ownerId": user.id,
    }
  };

  dynamodb.query(params, (error, result) => {
    if (error) {
      console.error(error);
      callback(null, utils.createResponse(500));   
      return;
    }
    
    user.subscribedTopics = [
		  {topic: 'temp', dataType: '1'},
		  {topic: 'humid', dataType: '1'},
		  {topic: 'temp', dataType: '1w'},
      {topic: 'humid', dataType: '3d'}];
    

    // get dashboard data
    getDashboardData(user.id, user.subscribedTopics, function(error, data) {
      if (error) {
        console.error(error);
        callback(null, utils.createResponse(500));
        return;
      }

      callback(null, utils.createResponse(200, null, 
      {
        dashboard: result.Items,
        data: data
      }));
    });    
  });
};