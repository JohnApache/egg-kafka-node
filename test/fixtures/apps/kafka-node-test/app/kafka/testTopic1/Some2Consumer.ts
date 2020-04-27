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
  async subscribe(message: Partial<IMessage> = {}) {
    const { topic = '', key = '', value = '' } = message || {};
    const msg = await asyncTsTask(topic, key, value);
    console.log(msg);
  }
}

export default Some2Subscription;