/* eslint-disable no-constant-condition */
/* eslint-disable no-console */

class QuicSocketBi {
    public transport: WebTransport;

    public connectionState: 'ready' | 'closed' | 'closing';

    public url: string;

    private streamNumber: number;

    public socketMessages: string;

    public stream: any;

    private writer: any;

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
    };

    // eslint-disable-next-line no-unused-vars
    sendData = async (rawData: string) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(rawData);
        try {
            console.log(this.stream);
            if (!this.stream) {
                console.log('here');
                this.stream = await this.transport.createBidirectionalStream();
                this.readFromIncomingStream(this.stream);
            }
            this.streamNumber += 1;

            if (!this.writer) {
                this.writer = this.stream.writable.getWriter();
            }
            await this.writer.write(data);
        } catch (e) {
            console.log(`Error while sending data: ${e}`, 'error');
        }
    };

    // eslint-disable-next-line class-methods-use-this
    readFromIncomingStream = async (stream: any) => {
        const decoder = new TextDecoderStream('utf-8');
        const reader = stream.readable.pipeThrough(decoder).getReader();
        try {
            while (true) {
                // eslint-disable-next-line no-await-in-loop
                const { value, done } = await reader.read();
                console.log(value);
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

const quicSocketBi = new QuicSocketBi();
quicSocketBi.connect();

export default quicSocketBi;
