import React from 'react';
import './App.css';
import Header from './components/header';
import Layout from './components/layout';
import Sidebar from './components/sidebar';
import MainPage from './pages/main-page';

function App() {
    return (
        <div className="App">
            <Header />
            <Sidebar />
            <Layout>
                <MainPage />
            </Layout>
        </div>
    );
}

export default App;
