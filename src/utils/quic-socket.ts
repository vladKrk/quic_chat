/* eslint-disable no-constant-condition */
/* eslint-disable no-console */

class QuicSocket {
    public transport: WebTransport;

    public connectionState: 'ready' | 'closed' | 'closing';

    public url: string;

    private streamNumber: number;

    private currentTransportDatagramWriter: any;

    public socketMessages: string;

    public stream: any;

    public onRecieveData: (message: string) => void;

    constructor(url = 'https://localhost:4433/socket') {
        this.url = url;
    }

    close = () => {
        this.connectionState = 'closing';
        this.transport.close({ closeCode: 200, reason: 'Correct closing' });
    };

    connect = async () => {
        try {
            this.transport = new WebTransport(this.url);
        } catch (e) {
            console.log(`Failed to create connection object. ${e} error`);
        }

        try {
            await this.transport.ready;
            this.connectionState = 'ready';
            console.log('Connection ready.');
        } catch (e) {
            console.log(`Connection failed. ${e}`, 'error');
        }
        this.transport.closed
            .then(() => {
                console.log('Connection closed normally.');
            })
            .catch(() => {
                console.log('Connection closed abruptly.', 'error');
            })
            .finally(() => {
                this.connectionState = 'closed';
            });
        this.streamNumber = 1;
        this.acceptUnidirectionalStreams();
    };

    // eslint-disable-next-line no-unused-vars
    sendData = async (rawData: string) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(rawData);
        try {
            this.stream = await this.transport.createUnidirectionalStream();
            this.streamNumber += 1;

            const writer = this.stream.getWriter();
            await writer.write(data);
            await writer.close();
        } catch (e) {
            console.log(`Error while sending data: ${e}`, 'error');
        }
    };

    async acceptUnidirectionalStreams() {
        const reader = this.transport.incomingUnidirectionalStreams.getReader();
        try {
            while (true) {
                // eslint-disable-next-line no-await-in-loop
                const { value, done } = await reader.read();
                if (done) {
                    return;
                }
                const stream = value;
                const number = this.streamNumber;
                this.streamNumber += 1;
                this.readFromIncomingStream(stream);
            }
        } catch (e) {
            console.log(`Error while accepting streams: ${e}`, 'error');
        }
    }

    // eslint-disable-next-line class-methods-use-this
    readFromIncomingStream = async (stream: any) => {
        const decoder = new TextDecoderStream('utf-8');
        const reader = stream.pipeThrough(decoder).getReader();
        try {
            while (true) {
                // eslint-disable-next-line no-await-in-loop
                const { value, done } = await reader.read();
                if (done) {
                    return;
                }
                const data = value;
                this.onRecieveData(data);
            }
        } catch (e) {
            console.log(
                `Error while reading from stream #${'any'}: ${e}`,
                'error'
            );
            console.log(`    ${e.message}`);
        }
    };
}

const quicSocket = new QuicSocket();
quicSocket.connect();

export default quicSocket;
