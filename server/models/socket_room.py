from aioquic.h3.connection import H3_ALPN, H3Connection
from typing import List, Dict


class SocketRoom:

    def __init__(self, room_id):
        self.room_id = room_id
        self.users = []
        self.messages = []

    def add_user(self, connection: H3Connection, session_id: str, id: str) -> None:
        self.users.append({
            'connection': connection,
            'session_id': session_id,
            'id': str(id)
        })

    def delete_user(self, id) -> None:
        for ind, user in enumerate(self.users):
            if user['id'] == str(id):
                self.users.pop(ind)
                return

    def get_user_by_id(self, id) -> None:
        for user in self.users:
            if user['id'] == str(id):
                return user

    def add_message(self, id, message) -> None:
        self.messages.append({'id': str(id), 'message': message})
