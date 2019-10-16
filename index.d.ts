interface MessageType {
    topic: string,
    key: string, // Specify consumer for the corresponding key under topic
    messages: string | string[]
}

declare module 'egg' {
    
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