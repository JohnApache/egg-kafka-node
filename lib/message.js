'use strict';

module.exports = config => {
  const { attributes = 0 } = config.producerOption;
  return function(topic, key, messages, timestamp) {
    return {
      topic,
      messages, // multi messages should be a array, single message can be just a string or a KeyedMessage instance
      key, // only needed when using keyed partitioner
      // partition: app.config.kafkaNode.pub.partition, // default 0
      attributes, // default: 0
      timestamp: timestamp || Date.now(), // <-- defaults to Date.now() (only available with kafka v0.10 and KafkaClient only)
    };
  };
};
