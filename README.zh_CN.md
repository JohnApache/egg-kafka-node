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

该插件是[kafka-node](https://github.com/SOHU-Co/kafka-node) 的封装, 方便在egg.js 环境下使用的一个egg风格的插件, 并提供了方便的api发送给kafka消息的方法 部分详细配置请参考 [https://github.com/SOHU-Co/kafka-node](https://github.com/SOHU-Co/kafka-node)


## 依赖说明

### 依赖的 egg 版本

egg-kafka-node 版本 | egg 1.x
--- | ---
1.x | 😁
0.x | 😁

### 依赖的 Node 版本
node >= 8.0.0  😁

## 开启插件

```js
// config/plugin.js
exports.kafkaNode = {
  enable: true,
  package: 'egg-kafka-node',
};
```

## 配置
```js
// {app_root}/config/config.default.js
exports.kafkaNode = {
  kafkaHost: '127.0.0.1:9092', // kafka 连接的地址
  clientOption: {}, // KafkaClient 相关配置, 更多配置可以查看kafka-node
  consumerOption: [{
    groupId: 'group1', // consumerGroup 消费组id
    topics: [ 'testTopic1' ], // 同一消费组 consumerGroup 下的所有 topic
    options: {
        fetchMaxWaitMs: 100,
        fetchMinBytes: 1,
         fetchMaxBytes: 1024 * 1024,
    }, // 每个消费组对应的相关 consumerGroup 配置
  }, {
    groupId: 'group2',
    topics: [ 'testTopic2' ],
    options: {},
  }, {
    groupId: 'group3',
    topics: [ 'testTopic3' ],
  }],
  // HighLevelProducer 生产者配置, 更多配置可以查看kafka-node
  producerOption: {
    requireAcks: 1, 
    ackTimeoutMs: 100, 
    partitionerType: 2, 
    autoCreateTopic: true, // 是否开启自动创建 topic功能
    topics: [ 'testTopic1', 'testTopic2', 'testTopic3' ], // 所有消费组需要包含的topics 集合
  },
  messageOption: {
    partition: 0,
    attributes: 0, // 发送消息的相关配置
  },
};
```

## 详细配置

请到 [config/config.default.js](test/fixtures/apps/config/config.default.js] 查看详细配置项说明。

## 目录结构

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

> Note: kafka配置下 生产者配置 producerOption 配置的topics必须在{app-root}/kafka 目录下创建对应的topic。kafka 会自动读取topic 目录下对应的Consumer.js ，并自动设置文件名前缀对应的 key 名， 该key需要在sendMessage 时提供 这个 key， 方便业务区分

> Note: 你必须设置 app.config.baseDir， egg-kafka-node 需要基于 这个baseDir 去加载所使用的consumers

## 使用案例

```js
// {app_root}/controller/index.js
class IndexController extends Controller {
  async index() {
    await this.ctx.kafka.sendMessage({
      topic: 'someTopic', // 指定 kafka 目录下 的topic 
      key: 'someKey', // 指定 kafka 下的 topic 目录 对应key的consumer
      message: JSON.stringify({
        username: 'JohnApache',
        userId: 10001,
        gender: 0
      })
    });
  }

  async some() {
    this.ctx.kafka.sendMessageSync({
      topic: 'someTopic', // 指定 kafka 目录下的 topic 
      key: 'someKey', // 指定 kafka 下的 topic 目录 对应key 的consumer
      message: JSON.stringify({
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
## 提问交流
请到 [egg issues](https://github.com/JohnApache/egg-kafka-node/issues) 异步交流。

## License

[MIT](LICENSE)
