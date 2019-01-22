'use strict';

const { sizeOf } = require('./utils');
const Message = require('./message');
const checkMessage = (messages, fetchMaxBytes = 1024 * 1024) => {
  const err = new Error('valid format messages');
  let len = 0;
  if (Array.isArray(messages)) {
    for (let i = 0, ii = messages.length; i < ii; i++) {
      const m = messages[i];
      if (typeof m !== 'string') return err;
      len += sizeOf(m);
    }
  } else if (typeof messages === 'string') {
    len += sizeOf(messages);
  } else {
    return err;
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
