'use strict';

const Controller = require('egg').Controller;
class KafkaController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.body = 'test kafka';
  }
}

module.exports = KafkaController;
