'use strict';

// const Subscription = require('egg').Subscription;
// 支持引入ts 文件
const asyncTsTask = (topic, key, value) => {
  const aaaa: number = 111;
  return new Promise(resolve => {
    resolve(`[Some2Consumer] test message:${aaaa} ${topic} : ${key} : ${value} : ${new Date()}`);
  });
};

class Some2Subscription {
  async subscribe(message: any = {}) {
    const { topic, key, value } = message || {};
    const msg = await asyncTsTask(topic, key, value);
    console.log(msg);
  }
}

module.exports = Some2Subscription;
