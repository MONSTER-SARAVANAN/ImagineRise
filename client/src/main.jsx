import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {BrowserRouter as Router} from "react-router-dom";
import './index.css'
import App from './App.jsx'
import AppContextProvider from './context/AppContext.jsx';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </Router>
  </StrictMode>,
)
