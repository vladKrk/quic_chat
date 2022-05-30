import * as React from 'react';
import AppBar from '@mui/material/AppBar';

import Toolbar from '@mui/material/Toolbar';

import Typography from '@mui/material/Typography';

import Container from '@mui/material/Container';
import { LogoDev } from '@mui/icons-material';
import { Divider } from '@mui/material';

function Header() {
    return (
        <AppBar
            position="fixed"
            sx={{
                background: 'rgb(255, 255, 255)',
                width: `calc(100% - ${240}px)`,
                ml: `${240}px`,
                boxShadow: 'none'
            }}
        >
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    <LogoDev
                        color="primary"
                        sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }}
                    />
                    <Typography
                        variant="h6"
                        noWrap
                        component="a"
                        href="/"
                        sx={{
                            mr: 2,
                            display: { xs: 'none', md: 'flex' },
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: 'black',
                            textDecoration: 'none'
                        }}
                    >
                        QUIC chat
                    </Typography>
                </Toolbar>
            </Container>
            <Divider />
        </AppBar>
    );
}

export default Header;
