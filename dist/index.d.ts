type Fn = () => any;
interface Ticker {
    subscribe: (cb: (timestamp: Number) => void) => Fn;
    start: () => Ticker;
    stop: () => Ticker;
    setInterval: (ms: Number) => Ticker;
}
export declare const createTicker: (interval?: number, start?: boolean, logger?: any) => Ticker;
export {};
