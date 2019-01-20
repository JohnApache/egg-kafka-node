'use strict';

const kafka = require('kafka-node');
const defaultOptions = {
  kafkaHost: 'localhost:9092', // A string of kafka broker/host combination delimited by comma
  connectTimeout: 10000, // in ms it takes to wait for a successful connection before moving to the next host
  requestTimeout: 30000, // in ms for a kafka request to timeout
  autoConnect: true, // automatically connect when KafkaClient is instantiated otherwise you need to manually call connect
  // idleConnection: 5 * 60 * 1000  // allows the broker to disconnect an idle connection from a client
  // connectRetryOptions:           // object hash that applies to the initial connection
  maxAsyncRequests: 10, // maximum async operations at a time toward the kafka cluster
  // sslOptions: '',                // Object, options to be passed to the tls broker sockets
  // sasl: ''                       // Object, SASL authentication configuration (only SASL/PLAIN is currently supported)
};
module.exports = function(config) {
  const { clientOptions = {}, kafkaHost } = config;
  const options = Object.assign({}, defaultOptions, { kafkaHost }, clientOptions);
  return new kafka.KafkaClient(options);
};
