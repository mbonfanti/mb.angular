// Generated by typings
// Source: https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/25d46c96646e9838d14aa7405a232fe79b3423e4/merge-stream/merge-stream.d.ts
declare module "merge-stream" {
    interface IMergedStream extends NodeJS.ReadWriteStream {
        add(source: NodeJS.ReadableStream): IMergedStream;
        add(source: NodeJS.ReadableStream[]): IMergedStream;
        isEmpty(): boolean;
    }

    function merge<T extends NodeJS.ReadableStream>(...streams: T[]): IMergedStream;
    export = merge;
}
