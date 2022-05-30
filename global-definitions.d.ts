/* eslint-disable max-classes-per-file */

class WebTransport {
    constructor(url: string);

    ready: Promise<void>;

    closed: Promise<void>;

    close: (closeInfo: { closeCode: number; reason: string }) => void;

    session: any;

    createUnidirectionalStream: () => Promise<any>;

    createBidirectionalStream: () => Promise<any>;

    datagrams: {
        readable: {
            getReader: () => void;
        };
        writable: {
            getWriter: () => void;
        };
    };

    incomingUnidirectionalStreams: {
        getReader: () => { read: () => Promise<any> };
    };
}

class TextDecoderStream {}

declare module '*.scss';
