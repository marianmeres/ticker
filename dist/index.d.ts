interface Ticker {
    subscribe: (cb: (timestamp: number) => void) => CallableFunction;
    start: () => Ticker;
    stop: () => Ticker;
    setInterval: (ms: number) => Ticker;
}
export declare const createTicker: (interval?: number, start?: boolean, logger?: any) => Ticker;
interface DelayedTickerVal {
    started: number;
    finished: number;
    error: any;
    result: any;
}
interface DelayedWorkerTicker {
    subscribe: (cb: (previous: DelayedTickerVal) => void) => CallableFunction;
    start: () => DelayedWorkerTicker;
    stop: () => DelayedWorkerTicker;
    setInterval: (ms: number) => DelayedWorkerTicker;
}
export declare const createDelayedWorkerTicker: (worker: CallableFunction, interval?: number, start?: boolean) => DelayedWorkerTicker;
export {};
