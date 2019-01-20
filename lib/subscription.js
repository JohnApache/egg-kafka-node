'use strict';

const createEventsProxy = require('eventsproxy');
const path = require('path');
const fs = require('fs');

const {
  SUBSCRIBE_CONSUMER_LOADED,
} = require('./definition');

const ep = createEventsProxy();

const readAllConsumers = (baseReadDir, consumerOption = []) => {

  consumerOption.forEach(group => {
    const { topics = [] } = group;
    topics.forEach(topic => {
      const targetTopic = path.join(baseReadDir, topic);

      const files = fs.readdirSync(targetTopic);
      files.forEach(file => {
        const targetConsumer = path.join(targetTopic, file);
        const stat = fs.statSync(targetConsumer);
        const m = file.match(/^(.+)Consumer.js$/);
        if (stat.isFile() && m) {
          ep.emit(SUBSCRIBE_CONSUMER_LOADED, {
            key: `${topic}:${m[1]}`,
            consumer: require(targetConsumer),
          });
        }
      });

      // tip: fileDirent support Node 10.10.0
      // const fileDirents = fs.readdirSync(targetTopic, {
      //   withFileTypes: true,
      // });
      // fileDirents.forEach(dirent => {
      //   if (dirent.isFile()) {
      //     const fname = dirent.name;
      //     const m = fname.match(/^(.+)Consumer.js$/);
      //     const targetConsumer = path.join(targetTopic, fname);
      //     if (m) {
      //       ep.emit(SUBSCRIBE_CONSUMER_LOADED, {
      //         key: `${topic}:${m[1]}`,
      //         consumer: require(targetConsumer),
      //       });
      //     }
      //   }
      // });

    });
  });
};


const createSubscription = (baseReadDir, consumerOption = []) => {

  const topicSubscription = new Map();

  ep.register(SUBSCRIBE_CONSUMER_LOADED, data => {
    topicSubscription.set(data.key, data.consumer);
  });

  readAllConsumers(baseReadDir, consumerOption);
  return topicSubscription;
};

module.exports = createSubscription;
