interface Ticker {
    subscribe: (cb: (timestamp: number) => void) => CallableFunction;
    start: () => Ticker;
    stop: () => Ticker;
    setInterval: (ms: number) => Ticker;
}
export declare const createTicker: (interval?: number, start?: boolean, logger?: any) => Ticker;
interface RecTickerVal {
    started: number;
    finished: number;
    error: any;
    result: any;
}
interface RecursiveTicker {
    subscribe: (cb: (previous: RecTickerVal) => void) => CallableFunction;
    start: () => RecursiveTicker;
    stop: () => RecursiveTicker;
    setInterval: (ms: number) => RecursiveTicker;
}
export declare const createRecursiveTicker: (worker: CallableFunction, interval?: number, start?: boolean) => RecursiveTicker;
export {};
