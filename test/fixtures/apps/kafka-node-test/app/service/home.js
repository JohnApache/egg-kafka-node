'use strict';

const Service = require('egg').Service;

class HomeService extends Service {
  async find() {
    const text = await new Promise(resolve => {
      setTimeout(() => {
        resolve('Hello World');
      });
    });
    return text;
  }
}

module.exports = HomeService;
