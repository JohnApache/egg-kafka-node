'use strict';

exports.keys = '123456';

exports.kafkaNode = {
  kafkaHost: '127.0.0.1:9092',
  clientOption: {},
  consumerOption: [{
    groupId: 'group1',
    topics: [ 'testTopic1' ],
    consumerOption: {
      fetchMaxBytes: 1024 * 1024,
    },
  }, {
    groupId: 'group2',
    topics: [ 'testTopic2', 'testTopic3' ],
    consumerOption: {},
  }, {
    groupId: 'group3',
    topics: [ 'testTopic3' ],
  }],
  producerOption: {
    requireAcks: 1,
    ackTimeoutMs: 100,
    partitionerType: 2,
    autoCreateTopic: true,
    topics: [ 'testTopic1', 'testTopic2', 'testTopic3' ],
  },
  messageOption: {
    partition: 0,
    attributes: 0,
  },
};
