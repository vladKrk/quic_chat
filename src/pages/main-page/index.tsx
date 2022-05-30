import { Box, Button, Container, TextField } from '@mui/material';
import { AccountCircle, Send, Face } from '@mui/icons-material';
import React, { useEffect, useState, useRef } from 'react';
import quicSocketBi from '../../utils/quic-socket-bi';

import styles from './main.module.scss';
import tcpSocket from '../../utils/tcp-socket';

type SocketResponse = {
    action: 'get_messages' | 'new_message';
    data: any;
};

type Message = {
    id: string;
    message: string;
    isOwn: boolean;
};

function MainPage() {
    const bottomRef = useRef<HTMLDivElement | undefined>();
    const [message, setMessage] = useState('');
    const [messageBlocks, setMessageBlocks] = useState<Message[]>([]);

    const startChat = async () => {
        if (quicSocketBi.connectionState !== 'ready') {
            await quicSocketBi.connect();
        }
        quicSocketBi.onRecieveData = (data) => {
            const result: SocketResponse = JSON.parse(data);
            if (result.action === 'get_messages') {
                setMessageBlocks(result.data.messages);
            } else if (result.action === 'new_message') {
                setMessageBlocks((prevState) => {
                    const newState = [...prevState];
                    newState.push(result.data);
                    return newState;
                });
            }
        };
        quicSocketBi.sendData(
            JSON.stringify({
                action: 'get_messages'
            })
        );
    };

    const startChatWebSocket = async () => {
        tcpSocket.onReceiveData = (data) => {
            const result: SocketResponse = JSON.parse(data);
            if (result.action === 'get_messages') {
                setMessageBlocks(result.data.messages);
            } else if (result.action === 'new_message') {
                setMessageBlocks((prevState) => {
                    const newState = [...prevState];
                    newState.push(result.data);
                    return newState;
                });
            }
        };
        tcpSocket.listen();
        tcpSocket.sendData(
            JSON.stringify({
                action: 'get_messages'
            })
        );
    };

    useEffect(() => {
        startChat();
        fetch('https://localhost:4433', {
            method: 'GET',
            mode: 'no-cors'
        });
    }, []);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messageBlocks]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        quicSocketBi.sendData(
            JSON.stringify({
                action: 'new_message',
                data: { message }
            })
        );
        setMessage('');
    };

    const keyPress = (e) => {
        if (e.keyCode === 13) {
            quicSocketBi.sendData(
                JSON.stringify({
                    action: 'new_message',
                    data: { message }
                })
            );
            setMessage('');
        }
    };

    return (
        <Container
            sx={{
                height: '100%',
                padding: '10px'
            }}
        >
            <Box
                sx={{
                    width: '100%',
                    height: '80%',
                    marginTop: '30px',
                    marginBottom: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    rowGap: '10px',
                    padding: '20px',
                    overflowY: 'auto'
                }}
            >
                {messageBlocks.map((m) => (
                    <div
                        className={styles.message}
                        key={m.id + m.message + Math.random()}
                        style={{ borderColor: m.isOwn ? '#1976D2' : 'black' }}
                    >
                        {m.isOwn ? <Face /> : <AccountCircle />} {m.message}
                    </div>
                ))}
                <div ref={bottomRef} />
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 20px'
                }}
            >
                <TextField
                    id="outlined-basic"
                    label="Your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    size="small"
                    fullWidth
                    onKeyDown={keyPress}
                    InputProps={{
                        endAdornment: (
                            <Button
                                onClick={handleClick}
                                variant="contained"
                                endIcon={<Send />}
                                sx={{
                                    height: '40px',
                                    borderRadius: '0 4px 4px 0',
                                    marginRight: '-13px',
                                    boxShadow: 'none'
                                }}
                            >
                                Send
                            </Button>
                        )
                    }}
                />
            </Box>
        </Container>
    );
}

export default MainPage;
