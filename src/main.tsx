import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// StrictMode intentionally double-mounts components in development. Our PDF modal
// pushes/pops history entries in its mount/cleanup lifecycle and the dev double-mount
// caused the modal to close itself immediately after opening. Production behavior is
// identical with or without StrictMode, so we drop it here for a smoother dev experience.
createRoot(document.getElementById('root')!).render(<App />)
