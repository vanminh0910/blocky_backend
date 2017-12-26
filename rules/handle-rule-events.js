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
    } else {
      for (var i = 0; i < result.Items.length; i++) {
        var rule = result.Items[i];
        if (rule.status) {
          try {
            var triggers = JSON.parse(rule.triggers);
            if (triggers.indexOf(triggerName) >= 0) {
              // Update values for rule's data
              var code = rule.actions;
              code = code.split('{{blocky_data_device_name}}').join('"' + deviceName + '"');
              code = code.split('{{blocky_data_mqtt|' + triggerTopic + '}}').join('"' + data.message + '"');

              var ruleMqttTopicList = utils.getStrBetween(code, '{{blocky_data_mqtt|', '}}');
              var subcribedTopics = [];
              for (var j = 0; j < ruleMqttTopicList.length; j++) {
                subcribedTopics.push({
                  topic: ruleMqttTopicList[j],
                  dataType: 1
                });
              }
              if (ruleMqttTopicList.length) {
                getDashboardData(userId, subcribedTopics, function (error, data) {
                  if (error) {
                    console.error(error);
                  } else {
                    for (var k = 0; k < data.length; k++) {
                      var topic = '';
                      var message = '';
                      if (typeof data[k].topic != 'undefined') {
                        topic = data[k].topic;
                      }
                      if (data[k].data.length && typeof data[k].data[0].data != 'undefined') {
                        message = data[k].data[0].data;
                      }
                      code = code.split('{{blocky_data_mqtt|' + topic + '}}').join('"' + message + '"');
                    }
                    processRule(code);
                  }
                });
              } else {
                processRule(code);
              }
            }
          } catch (e) {
            console.log(e);
          }

        }
      }
    }
  });

  function processRule(code) {
    // Remove tokens having no data
    var tokens = utils.getStrBetween(code, '{{', '}}');
    for (var i = 0; i < tokens.length; i++) {
      code = code.split('{{' + tokens[i] + '}}').join('');
    }

    const {VM} = require('vm2');
    const vm = new VM({
      timeout: 1000,
      sandbox: {}
    });

    try {
      var actions = vm.run(code);
      var outputTopics = [];
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
          utils.sendMail(mailOptions);
        } else if (actions[i].type == 'action.mqtt') {
          outputTopics.push({
            topic: actions[i].configuration.topic,
            message: actions[i].configuration.message
          });
        }
      }

      if (outputTopics.length) {
        var mqtt = require('mqtt');
        var options = {
          port: config.mqttPort,
          host: config.mqttHost,
          username: '',
          password: 'rJy9dGo3b',
          connectTimeout: 30 * 1000
        };
        var client = mqtt.connect(config.mqttUrl, options);

        client.on('connect', function () {
          var count = 0;
          for (var i = 0; i < outputTopics.length; i++) {
            var topic = data.authKey + '/user/' + outputTopics[i].topic;
            var message = outputTopics[i].message;
            client.publish(topic, message, function () {
              count++;
              if (count == outputTopics.length) {
                client.end();
              }
            });
          }
        });
      }

    } catch (e) {
      console.log(e);
    }

  }
}