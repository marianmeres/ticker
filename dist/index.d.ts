export declare const createTicker: (interval?: number) => {
    subscribe: (cb: Function) => Function;
    start: () => any;
    stop: () => any;
};
