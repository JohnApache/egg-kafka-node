'use strict';

// const Subscription = require('egg').Subscription;

const asyncTask = (topic, key, value) => {
  return new Promise(resolve => {
    resolve(`[EverySubscription] test message: ${topic} : ${key} : ${value} : ${new Date()}`);
  });
};

class EverySubscription {
  async subscribe(message = {}) {
    const { topic, key, value } = message;
    const msg = await asyncTask(topic, key, value);
    console.log(msg);
  }
}

module.exports = EverySubscription;
