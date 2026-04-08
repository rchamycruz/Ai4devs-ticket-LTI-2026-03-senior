import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Dashboard from './components/Dashboard';
import AddCandidateForm from './components/AddCandidateForm';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/candidates/new" element={<AddCandidateForm />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
