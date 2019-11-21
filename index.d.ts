declare module 'egg' {

    type UnitMessage = string | Buffer;

    interface MessageType {
        topic: string,
        key?: string | Buffer, // Specify consumer for the corresponding key under topic
        messages: UnitMessage | UnitMessage[]
    }

    export interface Application {
        kafka: {
            sendMessage(msg: MessageType): Promise<any>
            sendMessageSync(msg: MessageType, scb: (data: any) => void, ecb: (err: any) => void): void
        };
    };

    export interface Context {
        kafka: {
            sendMessage(msg: MessageType): Promise<any>
            sendMessageSync(msg: MessageType, scb: (data: any) => void, ecb: (err: any) => void): void
        };
    }

}