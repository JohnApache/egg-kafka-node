'use strict';

const { HighLevelProducer } = require('kafka-node');

const defaultOptions = {
  requireAcks: 1,
  ackTimeoutMs: 5000,
  partitionerType: 2,
};
const createProducer = (client, options = {}) => {
  const params = Object.assign({}, defaultOptions, options);
  const producer = new HighLevelProducer(client, params);
  return producer;
};
module.exports = createProducer;
