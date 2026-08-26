import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import Dashboard from './dashboard/Dashboard'
import './index.css'

const isDashboard = window.location.pathname.startsWith('/app')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isDashboard ? <Dashboard /> : <App />}
  </React.StrictMode>,
)
