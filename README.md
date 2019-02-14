# egg-kafka-node

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-kafka-node.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-kafka-node
[travis-image]: https://www.travis-ci.org/JohnApache/events-proxy.svg
[travis-url]: https://travis-ci.org/JohnApache/egg-kafka-node
[codecov-image]: https://codecov.io/gh/JohnApache/egg-kafka-node/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/JohnApache/egg-kafka-node
[snyk-image]: https://snyk.io/test/github/JohnApache/egg-kafka-node/badge.svg?targetFile=package.json
[snyk-url]: https://snyk.io/test/github/JohnApache/egg-kafka-node?targetFile=package.json
[download-image]: https://img.shields.io/npm/dm/egg-kafka-node.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-kafka-node

- [English](README.md)
- [简体中文](README.zh_CN.md)

This plug-in is a package of [kafka-node] (https://github.com/SOHU-Co/kafka-node). It is an egg-style plug-in for easy use in the environment of egg.js. It also provides a detailed configuration of methods for sending Kafka messages. Refer to [https://github.com/SOHU-Co/kafka-node] (https://github.com/SOHU-Co/kafka-node). 


## Install

```bash
$ npm i egg-kafka-node --save
```

## Usage

```js
// {app_root}/config/plugin.js
exports.kafkaNode = {
  enable: true,
  package: 'egg-kafka-node',
};
```

## Configuration

```js
// {app_root}/config/config.default.js
exports.kafkaNode = {
  kafkaHost: '127.0.0.1:9092', // kafka connect host
  clientOption: {}, // KafkaClient option, more documentation please visit kafka-node
  consumerOption: [{
    groupId: 'group1', // consumerGroup's groupId
    topics: [ 'testTopic1' ], // topics under the same consumer group 
    options: {
      fetchMaxWaitMs: 100,
      fetchMinBytes: 1,
      fetchMaxBytes: 1024 * 1024,
    }, // relevant configuration for each consumer group, more documentation please visit kafka-node
  }, {
    groupId: 'group2',
    topics: [ 'testTopic2' ],
    options: {},
  }, {
    groupId: 'group3',
    topics: [ 'testTopic3' ],
  }],
  // HighLevelProducer option, more documentation please visit kafka-node
  producerOption: {
    requireAcks: 1, 
    ackTimeoutMs: 100, 
    partitionerType: 2, 
    autoCreateTopic: true, // Whether to turn on automatic topic creation. default true
    topics: [ 'testTopic1', 'testTopic2', 'testTopic3' ], // Topics that all consumers need to consume
  },
  messageOption: {
    partition: 0,
    attributes: 0, // send message option
  },
};
```

see [config/config.default.js](test/fixtures/apps/config/config.default.js) for more detail.

## Structure
```js
egg-project
├── package.json
├── app.js (optional)
├── app
|   ├── router.js
│   ├── controller
│   |   └── home.js
│   ├── service (optional)
│   |   └── user.js
│   |   └── response_time.js
│   └── kafka (optional)  --------> like `controller, service...`
│       ├── someTopic (optional)  -------> topic name of kafka
│            ├── someKey1Consumer.js(optional)  ------> `someKey1` is a key of someTopic
|            └── someKey2Consumer.js(optional)  ------> `someKey2` is an another key of someTopic
├── config
|   ├── plugin.js
|   ├── config.default.js
│   ├── config.prod.js
|   ├── config.test.js (optional)
|   ├── config.local.js (optional)
|   └── config.unittest.js (optional)

```  
## USE TIPS

> Note: The producer option topics of the kafkaNode configuration must create a corresponding topic directory under the {app-root}/kafka directory. Kafka-node automatically reads the file containing the'Consumers'filename under the topic, and the key needs to be passed in when sendMessage to facilitate business differentiation.

> Note: You must set app.config.baseDir, kafka need to load consumers base on the baseDir.

> Note: SendMessage messages max bytes depending on the configuration of you set.

## Example

```js
// {app_root}/controller/index.js
class IndexController extends Controller {
  async index() {
    await this.ctx.kafka.sendMessage({
      topic: 'someTopic', // Specify topics in the Kafka directory
      key: 'someKey', // Specify consumer for the corresponding key under topic
      messages: JSON.stringify({
        username: 'JohnApache',
        userId: 10001,
        gender: 0
      })
    });
  }

  async some() {
    this.ctx.kafka.sendMessageSync({
      topic: 'someTopic', // Specify topics in the Kafka directory
      key: 'someKey', // Specify consumer for the corresponding key under topic
      messages: JSON.stringify({
        username: 'JohnApache',
        userId: 10001,
        gender: 0
      })
    }, () => {
      // success callback 
    }, () => {
      // error callback 
    })
  }
}

// {app_root}/kafka/someTopic/someKeyConsumer.js
class SomeKeySubscription extends Subscription {
  async subscribe(message) {
    const {value, topic, key} = message;
    this.ctx.logger.info(`consume message ${value} by topic ${topic} key ${key} consumer`);
    await asyncTask();
  }
}
```

## Questions & Suggestions
Please open an issue [here](https://github.com/JohnApache/egg-kafka-node/issues).

## License

[MIT](LICENSE)
