// 'use strict';

// const uuid = require('uuid');
// const shortid = require('shortid');
// const validator = require('validator');
// const bcrypt = require('bcrypt-nodejs');
// const jwt = require('jsonwebtoken');
// const config = require('../lib/config');
// const constants = require('../lib/constants');
// const dynamodb = require('../lib/dynamodb');
// const utils = require('../lib/utils');

// module.exports.list = (event, context, callback) => {
//   const ownerId = event.requestContext.authorizer.principalId;
//   console.log(ownerId);
//   var params = {
//     TableName: process.env.DEVICES_TABLE_NAME,
//     IndexName : 'OwnerIdIndex',
//     KeyConditionExpression: "ownerId = :ownerId",
//     ExpressionAttributeValues: {
//         ":ownerId": ownerId,
//     }
//   };
  
//   dynamodb.query(params, (error, result) => {
//     // handle potential errors
//     if (error) {
//       console.error(error);
//       callback(null, utils.createResponse(500,'Internal server error'));   
//       return;
//     }
//     // create a response
//     callback(null, utils.createResponse(200,null,result.Items));
//   });
// };