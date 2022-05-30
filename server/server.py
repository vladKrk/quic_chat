# chrome.exe --origin-to-force-quic-on=localhost:4433 --ignore-certificate-errors-spki-list=6zj/49xsgS72iF4Soa1yFzZCFl9mSdfEUNFcKO6pqQc=

from models.socket_room import SocketRoom
import argparse
import asyncio
import logging
from collections import defaultdict
from logging.handlers import SocketHandler
from typing import Dict, Optional

from aioquic.asyncio import QuicConnectionProtocol, serve
from aioquic.h3.connection import H3_ALPN, H3Connection
from aioquic.h3.events import H3Event, HeadersReceived, WebTransportStreamDataReceived, DatagramReceived
from aioquic.quic.configuration import QuicConfiguration
from aioquic.quic.connection import stream_is_unidirectional
from aioquic.quic.events import ProtocolNegotiated, StreamReset, QuicEvent, ConnectionTerminated

import wsproto
import wsproto.events

from handlers.counter import CounterHandler
from handlers.socket import Socket

BIND_ADDRESS = 'localhost'
BIND_PORT = 4433

chat_room = SocketRoom(1)


class WebTransportProtocol(QuicConnectionProtocol):

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._http: Optional[H3Connection] = None
        self._handler: Optional[CounterHandler] = None

    def quic_event_received(self, event: QuicEvent) -> None:
        if isinstance(event, ProtocolNegotiated):
            self._http = H3Connection(self._quic, enable_webtransport=True)
            print("New connection")
        elif isinstance(event, StreamReset) and self._handler is not None:
            print('Close stream')
            self._handler.stream_closed(event.stream_id)
        elif isinstance(event, ConnectionTerminated):
            print('Close connection')
            if self._handler:
                self._handler.connection_closed()

        if self._http is not None:
            for h3_event in self._http.handle_event(event):
                self._h3_event_received(h3_event)

    def _h3_event_received(self, event: H3Event) -> None:
        if isinstance(event, HeadersReceived):
            headers = {}
            for header, value in event.headers:
                headers[header] = value
            if (headers.get(b":method") == b"CONNECT" and
                    headers.get(b":protocol") == b"webtransport"):
                self._handshake_webtransport(event.stream_id, headers)
            elif (headers.get(b":method") == b"CONNECT" and
                    headers.get(b":protocol") == b"websocket"):
                self._send_response(event.stream_id, 200, end_stream=True)
            else:
                self._send_response(event.stream_id, 200, end_stream=True)
        if self._handler:
            self._handler.h3_event_received(event)

    def _handshake_webtransport(self,
                                stream_id: int,
                                request_headers: Dict[bytes, bytes]) -> None:
        authority = request_headers.get(b":authority")
        path = request_headers.get(b":path")
        if authority is None or path is None:
            # `:authority` and `:path` must be provided.
            self._send_response(stream_id, 400, end_stream=True)
            return
        if path == b"/socket":
            assert(self._handler is None)
            self._handler = Socket(stream_id, self._http, chat_room)
            self._send_response(stream_id, 200)
        else:
            self._send_response(stream_id, 404, end_stream=True)

    def _send_response(self,
                       stream_id: int,
                       status_code: int,
                       end_stream=False) -> None:
        headers = [(b":status", str(status_code).encode())]
        if status_code == 200:
            headers.append((b"sec-webtransport-http3-draft", b"draft02"))
        self._http.send_headers(
            stream_id=stream_id, headers=headers, end_stream=end_stream)


def wakeup():
    # Call again
    loop.call_later(0.1, wakeup)


if __name__ == '__main__':

    args = {
        'certificate': './certificates/certificate.pem',
        'key': './certificates/privkey.pem',
        'password': 'hello',
    }

    configuration = QuicConfiguration(
        alpn_protocols=H3_ALPN,
        is_client=False,
        max_datagram_frame_size=65536,
    )
    configuration.load_cert_chain(
        args['certificate'], args['key'], password=args['password'])

    loop = asyncio.get_event_loop()
    loop.run_until_complete(
        serve(
            BIND_ADDRESS,
            BIND_PORT,
            configuration=configuration,
            create_protocol=WebTransportProtocol,
        ))

    try:
        print("Listening on https://{}:{}".format(BIND_ADDRESS, BIND_PORT))
        loop.call_later(0.1, wakeup)
        loop.run_forever()
    except KeyboardInterrupt:
        print(KeyboardInterrupt)
