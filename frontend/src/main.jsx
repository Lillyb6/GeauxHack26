import React from 'react';
import { createRoot } from 'react-dom/client';
import Experience from './Experience';
import {AuthProvider} from './AuthContext';
import './style.css';
createRoot(document.getElementById('root')).render(<React.StrictMode><AuthProvider><Experience/></AuthProvider></React.StrictMode>);
