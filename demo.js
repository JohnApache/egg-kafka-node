'use strict';

const path = require('path');
const Client = require('./lib/client');
const Consumer = require('./lib/consumer');
const Message = require('./lib/message');
const Producer = require('./lib/producer');
const Subscription = require('./lib/subscription');
const createEventsProxy = require('eventsproxy');

const {
  CLIENT_READY,
  PRODUCER_READY,
  CONSUMER_READY,
  SUBSCRIPTION_READY,
  TOPICS_READY,
  CONSUMER_CONNECT,
  PRINT_LOGGER,
  PRINT_ERROR_LOGGER,
} = require('./lib/definition');

const ep = createEventsProxy();

const app = {
  config: {},
};
app.config.baseDir = __dirname;
app.config.kafkaNode = {
  kafkaHost: '127.0.0.1:9092',
  clientOption: {},
  consumerOption: [{
    groupId: 'group1',
    topics: [ 'testTopic1' ],
    consumerOption: {},
  }, {
    groupId: 'group2',
    topics: [ 'testTopic2' ],
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


const ClientOp = (kafkaHost, clientOption = {}) => {
  const option = Object.assign({}, {
    kafkaHost,
  }, clientOption);
  const client = Client(option);
  ep.emit(CLIENT_READY, client);
  ep.emit(PRINT_LOGGER, '[egg-kafka-node] client ready!');
};

const ProducerOp = (client, producerOption) => {
  const producer = Producer(client);
  const {
    autoCreateTopic,
    topics,
  } = producerOption;
  producer.on('ready', () => {
    ep.emit(PRODUCER_READY, producer);
    ep.emit(PRINT_LOGGER, '[egg-kafka-node] producer ready!');

    if (autoCreateTopic && topics) {
      producer.createTopics(topics, false, err => {
        if (err) {
          ep.emit(PRINT_ERROR_LOGGER, '[egg-kafka-node] create topics error!');
          ep.emit(PRINT_ERROR_LOGGER, err);
          return;
        }
        ep.emit(TOPICS_READY, topics);
        ep.emit(PRINT_LOGGER, '[egg-kafka-node] create topics success!');
      });
    }
  });

  producer.on('error', error => {
    ep.emit(PRINT_ERROR_LOGGER, '[egg-kafka-node] producer connect error!');
    ep.emit(PRINT_ERROR_LOGGER, error);
  });
};

const SubscriptionOp = (baseReadDir, consumerOption) => {
  const topicSubscription = Subscription(baseReadDir, consumerOption);
  ep.emit(SUBSCRIPTION_READY, topicSubscription);
  ep.emit(PRINT_LOGGER, '[egg-kafka-node] load consumer subscription success');
};

const ConsumerOp = (config, topicSubscription) => {
  const consumerMemory = Consumer(config);

  // 等待所有consumer连接
  const unregister = ep.wait(CONSUMER_CONNECT, () => {
    ep.emit(PRINT_LOGGER, '[egg-kafka-node] all consumer conncect success!');
    unregister && unregister();
  }, consumerMemory.length);

  consumerMemory.forEach(consumer => {
    consumer.on('connect', () => {
      ep.emit(CONSUMER_CONNECT);
    });
    consumer.on('message', message => {
      const {
        topic,
        key,
      } = message;
      consumer.pause();
      const Subscriber = topicSubscription.get(`${topic}:${key}`);
      if (!Subscriber) return consumer.resume();
      const subcriber = new Subscriber();
      subcriber
        .subscribe(message)
        .then(() => {
          consumer.commit(err => {
            consumer.resume();
            if (err) {
              ep.emit(PRINT_ERROR_LOGGER, '[egg-kafka-node] commit offset error!');
              ep.emit(PRINT_ERROR_LOGGER, err);
            }
          });
        })
        .catch(() => {
          consumer.resume();
          ep.emit(PRINT_ERROR_LOGGER, '[egg-kafka-node] consume message fail!');
        });
    });
    consumer.on('error', error => {
      ep.emit(PRINT_ERROR_LOGGER, '[egg-kafka-node] consumer connect error!');
      ep.emit(PRINT_ERROR_LOGGER, error);
    });
  });
  ep.emit(CONSUMER_READY, consumerMemory);
};


const config = app.config.kafkaNode;

const {
  kafkaHost,
  producerOption = {},
  clientOption = {},
  consumerOption = [],
} = config;

const baseReadDir = path.join(app.config.baseDir, './app/kafka/');


ep.once(CLIENT_READY, client => {
  ProducerOp(client, producerOption);
  SubscriptionOp(baseReadDir, consumerOption);
});

ep.once([ PRODUCER_READY, TOPICS_READY, SUBSCRIPTION_READY ], (producer, topics, topicSubscription) => {
  ConsumerOp(config, topicSubscription);
});

ep.once(CONSUMER_READY, consumerMemory => {
  process.once('SIGINT', () => {
    consumerMemory.forEach(consumer => {
      ep.emit(PRINT_LOGGER, '[egg-kafka-node] consumer close connect');
      consumer.close(true, function(error) {
        if (error) {
          ep.emit(PRINT_ERROR_LOGGER, '[egg-kafka-node] consumer close connect fail!');
          ep.emit(PRINT_ERROR_LOGGER, error);
        }
      });
    });
  });
});

ep.on(PRINT_LOGGER, info => {
  console.info(info);
});

ep.on(PRINT_ERROR_LOGGER, error => {
  console.error(error);
});

ep.once(PRODUCER_READY, producer => {
  const createMessage = Message(config);
  const topic1Message = new Array(100);
  const topic2Message = new Array(100);
  const topic3Message = new Array(100);
  for (let i = 0; i < 100; i++) {
    topic1Message[i] = `this is a message ${new Date()} ${Math.random()}`;
  }
  for (let i = 0; i < 100; i++) {
    producer.send([ createMessage('testTopic1', 'Some', topic1Message) ], err => {
      if (err) {
        console.log(err);
      }
    });
  }

  for (let i = 0; i < 100; i++) {
    topic2Message[i] = `this is a message ${new Date()} ${Math.random()}`;
  }
  for (let i = 0; i < 100; i++) {
    producer.send([ createMessage('testTopic2', 'Every', topic2Message) ], err => {
      if (err) {
        console.log(err);
      }
    });
  }

  for (let i = 0; i < 100; i++) {
    topic3Message[i] = `this is a message ${new Date()} ${Math.random()}`;
  }
  for (let i = 0; i < 100; i++) {
    producer.send([ createMessage('testTopic3', 'New', topic3Message) ], err => {
      if (err) {
        console.log(err);
      }
    });
  }

});


ClientOp(kafkaHost, clientOption);
