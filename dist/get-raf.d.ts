export declare const getRaf: () => {
    requestAnimationFrame: (cb: (timeout: number) => void) => number;
    cancelAnimationFrame: (handle: number) => void;
};
