'use strict';

/**
 * egg-kafka-node default config
 * @member Config#kafkaNode
 * @property {String} SOME_KEY - some description
 */
exports.kafkaNode = {
  kafkaHost: '127.0.0.1:9092',
  clientOption: {},
  consumerOption: [],
  producerOption: {
    requireAcks: 1,
    ackTimeoutMs: 100,
    partitionerType: 2,
    autoCreateTopic: true,
    topics: [],
  },
  messageOption: {
    partition: 0,
    attributes: 0,
  },
};
