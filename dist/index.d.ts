interface Ticker {
    subscribe: (cb: (timestamp: number) => void) => Function;
    start: () => Ticker;
    stop: () => Ticker;
    setInterval: (ms: number) => Ticker;
}
export declare const createTicker: (interval?: number, start?: boolean, logger?: any) => Ticker;
export {};
