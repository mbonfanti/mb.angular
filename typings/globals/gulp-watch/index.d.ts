// Generated by typings
// Source: https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/56295f5058cac7ae458540423c50ac2dcf9fc711/gulp-watch/gulp-watch.d.ts
declare module 'gulp-watch' {
    interface IOptions {
        ignoreInitial?: boolean;
        events?: Array<string>;
        base?: string;
        name?: string;
        verbose?: boolean;
        readDelay?: number;
    }

    interface IWatchStream extends NodeJS.ReadWriteStream {
        add(path: string | Array<string>): NodeJS.ReadWriteStream;
        unwatch(path: string | Array<string>): NodeJS.ReadWriteStream;
        close(): NodeJS.ReadWriteStream;
    }

    function watch(glob: string | Array<string>, options?: IOptions, callback?: Function): IWatchStream;
    namespace watch {}
    export = watch;
}