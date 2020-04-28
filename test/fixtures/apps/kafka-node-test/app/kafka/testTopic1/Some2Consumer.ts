import {Context} from 'egg'
interface IMessage {
  topic: string;
  key: string;
  value: any;
}

const asyncTsTask = (topic: string, key: string, value: any) => {
  const aaaa:number = 111;
  return new Promise((resolve: any) => {
    resolve(`[Some2Consumer] test message:${aaaa} ${topic} : ${key} : ${value} : ${new Date()}`);
  });
};

class Some2Subscription {
  constructor(public ctx: Context) {}
  async subscribe(message: Partial<IMessage> = {}) {
    const { topic = '', key = '', value = '' } = message || {};
    const msg = await asyncTsTask(topic, key, value);
    console.log(msg);
    const text = await this.ctx.service.home.find();
    console.log(text);
  }
}

export default Some2Subscription;