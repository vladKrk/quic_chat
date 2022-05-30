/* eslint-disable no-console */
class TcpSocket {
    public url: string;

    public connectionState: 'ready' | 'closed';

    public socket: WebSocket;

    onReceiveData: (event) => void;

    constructor(url = 'ws://localhost:4433/ws') {
        this.url = url;
        this.socket = new WebSocket(this.url);
        this.socket.onopen = () => {
            this.connectionState = 'ready';
        };
        this.socket.onclose = (event) => {
            if (event.wasClean) {
                console.log('Соединение закрыто чисто');
            } else {
                console.log('Обрыв соединения');
            }
            this.connectionState = 'closed';
        };
        this.socket.onerror = (error) => {};
    }

    listen = () => {
        this.socket.onmessage = this.onReceiveData;
    };

    sendData = (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
        this.socket.send(data);
    };
}

const tcpSocket = new TcpSocket();

export default tcpSocket;
