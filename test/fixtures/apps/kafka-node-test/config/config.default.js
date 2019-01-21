'use strict';

exports.keys = '123456';

exports.kafkaNode = {
  kafkaHost: '127.0.0.1:9092',
  clientOption: {},
  consumerOption: [{
    groupId: 'group1',
    topics: [ 'testTopic1' ],
    options: {
      fetchMaxWaitMs: 100,
      fetchMinBytes: 1,
      fetchMaxBytes: 1024 * 1024,
    }, // 每个消费组对应的相关 consumerGroup 配置
  }, {
    groupId: 'group2',
    topics: [ 'testTopic2', 'testTopic3' ],
    options: {},
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
