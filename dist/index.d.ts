export declare const createTicker: (interval?: number) => {
    start: () => void;
    stop: () => void;
    subscribe: (cb: Function) => () => void;
};
