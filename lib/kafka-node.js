'use strict';

const path = require('path');
const Client = require('./client');
const Consumer = require('./consumer');
const Producer = require('./producer');
const Subscription = require('./subscription');
const createEventsProxy = require('eventsproxy');
const kafkaLogging = require('kafka-node/logging');
const { SendMessage, SendMessageSync } = require('./sendMessage');
const {
  CLIENT_READY,
  PRODUCER_READY,
  CONSUMER_READY,
  SUBSCRIPTION_READY,
  TOPICS_READY,
  CONSUMER_CONNECT,
  CLOSE_ALL_CONSUMER,
  START_READY,
} = require('./definition');


module.exports = app => {

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
    const start = Date.now();
    const unregister = ep.wait(CONSUMER_CONNECT, () => {
      app.logger.info(`[egg-kafka-node] all consumer connected, use time ${((Date.now() - start) / 1000).toFixed(3)} s!`);
      unregister && unregister();
    }, consumerMemory.length);
    // 不等待连接 并行后续任务
    ep.emit(CONSUMER_READY, consumerMemory);

    consumerMemory.forEach(consumer => {

      consumer.on('connect', () => {
        const { options = {} } = consumer;
        const { kafkaHost, groupId } = options;
        app.logger.info(`[egg-kafka-node] kafkaHost: ${kafkaHost} groupId: ${groupId} consumer connect success!`);
        ep.emit(CONSUMER_CONNECT);
      });

      consumer.on('message', message => {
        const {
          topic,
          key = '',
          value,
        } = message;
        consumer.pause();
        let Subscriber = topicSubscription.get(`${topic}:${key || ''}`);
        if (!Subscriber) Subscriber = topicSubscription.get(`${topic}:`);
        if (!Subscriber) return consumer.resume();
        const ctx = app.createAnonymousContext();
        const subscriber = new Subscriber(ctx);
        subscriber
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
        const { options = {} } = consumer;
        const { kafkaHost, groupId } = options;
        app.logger.error(`[egg-kafka-node] kafkaHost: ${kafkaHost} groupId: ${groupId} consumer connect error!`);
        app.logger.error(error);
      });
    });
  };

  const logger = app.getLogger('kafkaLogger');
  kafkaLogging.setLoggerProvider(logger);

  const config = app.config.kafkaNode;

  const {
    kafkaHost,
    producerOption = {},
    clientOption = {},
    consumerOption = [],
    baseConsumersDir = './app/kafka',
  } = config;

  const baseReadDir = path.join(app.config.baseDir, baseConsumersDir);

  ep.once(CLIENT_READY, client => {
    ProducerOp(client, producerOption, app);
    SubscriptionOp(baseReadDir, consumerOption, app);
  });

  ep.once([ PRODUCER_READY, TOPICS_READY, SUBSCRIPTION_READY, START_READY ], (producer, topics, topicSubscription) => {
    if (app.type === 'agent') return; // agent 进程不处理消费者
    ConsumerOp(config, topicSubscription, app);
  });

  ep.once(CONSUMER_READY, consumerMemory => {
    ep.once(CLOSE_ALL_CONSUMER, () => {
      consumerMemory.forEach(consumer => {
        const { options: { kafkaHost, groupId } } = consumer;
        consumer.close(true, error => {
          if (error) {
            app.logger.error(`[egg-kafka-node] kafkaHost: ${kafkaHost} groupId: ${groupId} consumer close connect fail!`);
            app.logger.error(error);
            return;
          }
          app.logger.info(`[egg-kafka-node] kafkaHost: ${kafkaHost} groupId: ${groupId} consumer connect already closed!`);
        });
      });
    });
  });

  ep.once(PRODUCER_READY, producer => {
    app.kafka = {
      sendMessage(data = {}) {
        return SendMessage(data, producer, config);
      },
      sendMessageSync(data = {}, scb, ecb) {
        SendMessageSync(data, producer, config, scb, ecb);
      },
    };
  });

  ClientOp(kafkaHost, clientOption, app);

  app.beforeClose(() => {
    ep.emit(CLOSE_ALL_CONSUMER);
  });

  app.beforeStart(async () => {
    app.coreLogger.info('[egg-kafka-node] started!');
  });

  app.ready(() => {
    app.coreLogger.info('[egg-kafka-node] ready!');
    ep.emit(START_READY);
  });

};
