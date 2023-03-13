interface Ticker {
    subscribe: (cb: (timestamp: number) => void) => Function;
    start: () => Ticker;
    stop: () => Ticker;
}
export declare const createTicker: (interval?: number, start?: boolean) => Ticker;
export {};
