'use strict';

const uuid = require('uuid');
const constants = require('../lib/constants');
const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');

module.exports.handleRuleEvents = (userId, data, callback) => {

  if (!userId || !data) {
    console.log('Invalid rule data');
    callback(new Error('Invalid rule data'), null);
    return;
  }

  console.log('handleRuleEvents', userId, data);
}