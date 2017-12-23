'use strict';

const uuid = require('uuid');
const constants = require('../lib/constants');
const dynamodb = require('../lib/dynamodb');
const config = require('../lib/config');
const utils = require('../lib/utils');
const getDashboardData = require('../dashboards/get-dashboard-data').getDashboardData;

module.exports.handleRuleEvents = (userId, data, callback) => {

  if (!userId || !data) {
    console.log('Invalid rule data');
    callback(new Error('Invalid rule data'), null);
    return;
  }

  var triggerName = null;
  var deviceName = '';
  var triggerTopic = '';
  if (typeof (data.event) !== 'undefined') {
    triggerName = 'device_' + data.event;
    deviceName = data.name || (data.type + '_' + data.chipId);
  } else {
    triggerName = 'mqtt_' + data.topic;
    triggerTopic = data.topic;
  }

  // Get user rules
  var params = {
    TableName: process.env.RULES_TABLE_NAME,
    KeyConditionExpression: "#ownerId = :ownerId",
    ExpressionAttributeNames: {
      "#ownerId": "ownerId"
    },
    ExpressionAttributeValues: {
      ":ownerId": userId
    }
  };

  dynamodb.query(params, (error, result) => {
    if (error) {
      console.error(error);
    }
    for (var i = 0; i < result.Items.length; i++) {
      var rule = result.Items[i];
      if (rule.status) {
        try {
          var triggers = JSON.parse(rule.triggers);
          if (triggers.indexOf(triggerName) >= 0) {
            processRule(rule);
          }
        } catch (e) {
          console.log(e);
        }

      }
    }
  });

  function processRule(rule) {
    var safeEval = require('safe-eval');
    var code = rule.actions;
    var context = {
      process: process,
      getMessageFromTopic: function (topic, returnType) {
        if (topic == triggerTopic) {
          return returnType == 'string' ? String(data.message) : Number(data.message);
        } else {
          // To do: return from dashboard data
          var topicRequest = [{
            topic: topic,
            dataType: 1
          }];
          getDashboardData(userId, topicRequest, function (error, data) {
            if (error) {
              console.error(error);
            }
            console.log('data', data);
            return data[0].data;
          });
        }
      },
      getDeviceName: function () {
        return deviceName;
      }
    };

    try {
      var actions = safeEval(code, context);
      console.log(actions);
      for (var i = 0; i < actions.length; i++) {
        if (actions[i].type == 'action.email') {
          var mailOptions = {
            to: actions[i].configuration.email,
            from: config.emailSender,
            template: 'user-rule-email',
            subject: actions[i].configuration.subject,
            context: {
              message: actions[i].configuration.message,
              webAppUrl: config.webAppUrl
            }
          };
          console.log(mailOptions);
          utils.sendMail(mailOptions);
        }
      }

    } catch (e) {
      console.log(e);
    }

  }
}