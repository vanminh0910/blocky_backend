'use strict';

const Promise = require('bluebird');
const constants = require('../lib/constants');
const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');

function getTopicData(userId, topic) {
  return new Promise(function (resolve, reject) {
    var userIdTopic = userId + '_' + topic.topic;
    var limit = 500;
    var createdAtFilter = 0;
    
    if (topic.dataType == '1' || topic.dataType == 1) {
      limit = 1;
    } else if (topic.dataType == '1d' ) {
      createdAtFilter = utils.getEpochTime(1);
    } else if (topic.dataType == '3d' ) {
      createdAtFilter = utils.getEpochTime(3);
    } else if (topic.dataType == '1w' ) {
      createdAtFilter = utils.getEpochTime(7);
    } else if (topic.dataType == '2w' ) {
      createdAtFilter = utils.getEpochTime(14);
    }    

    var params = {
      TableName: process.env.MESSAGES_TABLE_NAME,
      KeyConditionExpression: 'userIdTopic = :userIdTopic and createdAt >= :createdAt', // a string representing a constraint on the attribute
      ExpressionAttributeValues: { // a map of substitutions for all attribute values
        ':userIdTopic': userIdTopic,
        ':createdAt': createdAtFilter
      },
      ScanIndexForward: false,
      ProjectionExpression: '#data, createdAt',
      ExpressionAttributeNames: {
          '#data': 'data'
      },
      Limit: limit
    };

    dynamodb.query(params, (error, result) => {
      if (error) {
        console.log(error);
        reject(error);
      }

      topic.data = result.Items;
      resolve(topic);
    });    
  });
}

module.exports.getDashboardData = (userId, topics, callback) => {
  if (!topics)
    callback(null, null);
  
  var promises = [];

  for (var i = 0; i < topics.length; i++) { 
    promises.push(getTopicData(userId, topics[i]));
  }

  Promise.all(promises).then(function(result) {
    console.log(result);
    callback(null, result);
  }).catch(function(error) {
    console.log(error);
    callback(error, null);
  });
};
