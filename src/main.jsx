import React from "react";
import App from './App.jsx'
import { createRoot } from 'react-dom/client';
import './index.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="*" element={<App />} />
          </Routes>
      </BrowserRouter>
  </React.StrictMode>,
);
