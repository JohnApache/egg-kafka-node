'use strict';

const Message = require('./message');


const isString = str => typeof str === 'string';
const isBuffer = buf => Buffer.isBuffer(buf);
const isArray = arr => Array.isArray(arr);

const checkMessage = (messages, fetchMaxBytes = 1024 * 1024) => {
  let len = 0;
  if (isArray(messages)) {
    for (let i = 0, ii = messages.length; i < ii; i++) {
      const m = messages[i];
      if (isBuffer(m)) {
        len += m.length;
      } else if (isString(m)) {
        len += Buffer.byteLength(m);
      } else {
        return new Error('valid format messages');
      }
    }
  } else if (isString(messages)) {
    len += Buffer.byteLength(messages);
  } else if (isBuffer(messages)) {
    len += messages.length;
  } else {
    return new Error('valid format messages');
  }

  if (len > fetchMaxBytes) {
    return new Error(`messages max bytes is ${fetchMaxBytes}`);
  }
  return null;

};

const searchFetchMaxBytes = (config, topic) => {
  const { consumerOption = [] } = config;
  let fetchMaxBytes = 1024 * 1024;
  for (let i = 0, ii = consumerOption.length; i < ii; i++) {
    const group = consumerOption[i];
    const { topics = [], options = {} } = group;
    if (topics.some(v => v === topic) && options.fetchMaxBytes) {
      fetchMaxBytes = options.fetchMaxBytes;
      break;
    }
  }
  return fetchMaxBytes;
};


exports.SendMessage = (data = {}, producer, config) => {
  const { topic, key, messages } = data;
  const createMessage = Message(config);
  const fetchMaxBytes = searchFetchMaxBytes(config, topic);
  return new Promise((resolve, reject) => {
    const error = checkMessage(messages, fetchMaxBytes);
    if (error) return reject(error);
    producer.send([ createMessage(topic, key, [].concat(messages)) ], (err, data) => {
      if (err) return reject(err);
      return resolve(data);
    });
  });
};

exports.SendMessageSync = (data = {}, producer, config, scb, ecb) => {
  const { topic, key, messages } = data;
  const createMessage = Message(config);
  const fetchMaxBytes = searchFetchMaxBytes(config, topic);
  const error = checkMessage(messages, fetchMaxBytes);
  if (error) return ecb && ecb(error);
  producer.send([ createMessage(topic, key, [].concat(messages)) ], (err, data) => {
    if (err) return ecb && ecb(err);
    scb && scb(data);
  });
};
