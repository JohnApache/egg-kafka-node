'use strict';

const path = require('path');
const Client = require('./lib/client');
const Consumer = require('./lib/consumer');
const Message = require('./lib/message');
const Producer = require('./lib/producer');
const Subscription = require('./lib/subscription');
const createEventsProxy = require('eventsproxy');
const kafkaLogging = require('kafka-node/logging');

const {
  CLIENT_READY,
  PRODUCER_READY,
  CONSUMER_READY,
  SUBSCRIPTION_READY,
  TOPICS_READY,
  CONSUMER_CONNECT,
  START_READY,
  CLOSE_ALL_CONSUMER,
} = require('./lib/definition');

const ep = createEventsProxy();

const ClientOp = (kafkaHost, clientOption = {}, app) => {
  const option = Object.assign({}, {
    kafkaHost,
  }, clientOption);
  const client = Client(option);
  ep.emit(CLIENT_READY, client);
  app.coreLogger.info(`[egg-kafka-node] client kafkaHost:${kafkaHost} ready!`);
};

const ProducerOp = (client, producerOption, app) => {
  const producer = Producer(client);
  const {
    autoCreateTopic,
    topics,
  } = producerOption;
  producer.on('ready', () => {
    ep.emit(PRODUCER_READY, producer);
    app.coreLogger.info('[egg-kafka-node] producer ready!');
    if (autoCreateTopic && topics) {
      producer.createTopics(topics, false, err => {
        if (err) {
          app.coreLogger.error(`[egg-kafka-node] create topics: ${topics.join(' & ')} error!`);
          app.coreLogger.error(err);
          return;
        }
        ep.emit(TOPICS_READY, topics);
        app.coreLogger.info(`[egg-kafka-node] create topics: ${topics.join(' & ')} success!`);
      });
    }
  });

  producer.on('error', error => {
    app.coreLogger.error('[egg-kafka-node] producer connect error!');
    app.coreLogger.error(error);
  });
};

const SubscriptionOp = (baseReadDir, consumerOption, app) => {
  const topicSubscription = Subscription(baseReadDir, consumerOption);
  ep.emit(SUBSCRIPTION_READY, topicSubscription);
  app.coreLogger.info('[egg-kafka-node] load consumer subscription success');
};

const ConsumerOp = (config, topicSubscription, app) => {
  const consumerMemory = Consumer(config);
  // 等待所有consumer连接
  const unregister = ep.wait(CONSUMER_CONNECT, () => {
    app.coreLogger.info('[egg-kafka-node] all consumer conncect success!');
    ep.emit(START_READY);
    unregister && unregister();
  }, consumerMemory.length);

  // 不等待连接 并行后续任务
  ep.emit(CONSUMER_READY, consumerMemory);

  consumerMemory.forEach(consumer => {

    consumer.on('connect', () => {
      ep.emit(CONSUMER_CONNECT);
    });

    consumer.on('message', message => {
      const {
        topic,
        key,
        value,
      } = message;
      consumer.pause();
      const Subscriber = topicSubscription.get(`${topic}:${key}`);
      if (!Subscriber) return consumer.resume();
      const ctx = app.createAnonymousContext();
      const subcriber = new Subscriber(ctx);
      subcriber
        .subscribe(message)
        .then(() => {
          consumer.commit(err => {
            consumer.resume();
            if (err) {
              app.logger.error(`[egg-kafka-node] commit topic: ${topic} key: ${key} value: ${value} offset error!`);
              app.logger.error(err);
              return;
            }
          });
        })
        .catch(err => {
          consumer.resume();
          app.logger.error(`[egg-kafka-node] consumer consume topic: ${topic} key: ${key} value: ${value} fail!`);
          app.logger.error(err);
        });
    });

    consumer.on('error', error => {
      app.logger.error('[egg-kafka-node] consumer connect error!');
      app.logger.error(error);
    });
  });
};


module.exports = app => {
  const logger = app.getLogger('kafkaLogger');
  kafkaLogging.setLoggerProvider(logger);

  const config = app.config.kafkaNode;

  const {
    kafkaHost,
    producerOption = {},
    clientOption = {},
    consumerOption = [],
  } = config;

  const baseReadDir = path.join(app.config.baseDir, './app/kafka/');


  ep.once(CLIENT_READY, client => {
    ProducerOp(client, producerOption, app);
    SubscriptionOp(baseReadDir, consumerOption, app);
  });

  ep.once([ PRODUCER_READY, TOPICS_READY, SUBSCRIPTION_READY ], (producer, topics, topicSubscription) => {
    ConsumerOp(config, topicSubscription, app);
  });

  ep.once(CONSUMER_READY, consumerMemory => {
    ep.once(CLOSE_ALL_CONSUMER, () => {
      app.logger.info('[egg-kafka-node] consumer close connect');
      consumerMemory.forEach(consumer => {
        consumer.close(true, function(error) {
          if (error) {
            app.logger.eror('[egg-kafka-node] consumer close connect fail!');
            app.logger.eror(error);
          }
        });
      });
    });

    process.once('SIGINT', () => {
      ep.emit(CLOSE_ALL_CONSUMER);
    });
  });

  ep.once(PRODUCER_READY, producer => {
    const createMessage = Message(config);
    app.kafka = {
      sendMessage(data = {}) {
        const { topic, key, message } = data;
        return new Promise((resolve, reject) => {
          producer.send([ createMessage(topic, key, message) ], (err, data) => {
            if (err) return reject(err);
            return resolve(data);
          });
        });
      },
      sendMessageSync(data = {}, scb, ecb) {
        const { topic, key, message } = data;
        producer.send([ createMessage(topic, key, message) ], (err, data) => {
          if (err) return ecb && ecb(err);
          scb && scb(data);
        });
      },
    };
  });

  ClientOp(kafkaHost, clientOption, app);

  app.beforeClose(() => {
    ep.emit(CLOSE_ALL_CONSUMER);
  });

  app.beforeStart(async () => {
    app.coreLogger.info('[egg-kafka-node] starting...');
    const start = Date.now();
    await ep.async(START_READY);
    app.coreLogger.info('[egg-kafka-node] started!');
    app.coreLogger.info(`[egg-kafka-node] consumer connected, use time ${Date.now() - start}!`);
  });


};
