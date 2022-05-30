from collections import defaultdict
from msilib.schema import Error
from aioquic.h3.connection import H3_ALPN, H3Connection
from aioquic.h3.events import H3Event, HeadersReceived, WebTransportStreamDataReceived, DatagramReceived
from aioquic.quic.connection import stream_is_unidirectional
import uuid
import json


class Socket:

    def __init__(self, session_id, http: H3Connection, room) -> None:
        self._session_id = session_id
        self._http = http
        self.id = uuid.uuid4()
        self.data = ''
        self.chat_room = room
        self.chat_room.add_user(http, session_id, self.id)

    def broadcast(self, message) -> None:
        users = self.chat_room.users
        print(users)
        for user in users:
            response = str.encode(json.dumps({
                'action': 'new_message',
                'data': {
                    'id': str(user['id']),
                    'message': message,
                    'isOwn': str(user['id']) == str(self.id)
                }
            }))
            # response_id = user['connection'].create_webtransport_stream(
            #     self._session_id, is_unidirectional=True)
            try:
                user['connection']._quic.send_stream_data(
                    user['stream_id'], response, end_stream=False)
            except:
                pass

    def h3_event_received(self, event: H3Event) -> None:
        if isinstance(event, DatagramReceived):
            payload = str(len(event.data)).encode('ascii')
            self._http.send_datagram(self._session_id, payload)

        if isinstance(event, WebTransportStreamDataReceived):
            user = self.chat_room.get_user_by_id(self.id)
            user['stream_id'] = event.stream_id
            # self.data += event.data.decode('utf-8')
            # if event.stream_ended:
            value = event.data.decode('utf-8')
            if not value:
                return
            dataObj = json.loads(value)
            if dataObj['action'] == 'get_messages':
                self.get_messages_handler(event)
            elif dataObj['action'] == 'new_message':
                self.new_message_handler(event, dataObj)

    def new_message_handler(self, event, dataObj):
        payload = dataObj['data']['message']
        self.chat_room.add_message(self.id, payload)
        self.broadcast(payload)
        self.data = ''

    def get_messages_handler(self, event):
        response = str.encode(json.dumps({
            'action': 'get_messages',
            'data': {
                'messages': self.chat_room.messages
            }
        }))
        # response_id = self._http.create_webtransport_stream(
        #     self._session_id, is_unidirectional=True)
        self._http._quic.send_stream_data(
            event.stream_id, response, end_stream=False)
        self.data = ''
        self.stream_closed(event.stream_id)
        return

    def stream_closed(self, stream_id: int) -> None:
        try:
            pass
        except KeyError:
            pass

    def connection_closed(self) -> None:
        try:
            self.chat_room.delete_user(self.id)
        except Error:
            print(Error)
