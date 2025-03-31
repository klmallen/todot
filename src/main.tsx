import React from 'react';
import ReactDOM from 'react-dom/client';
import Editor from './engine/ui/Editor';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Editor />
  </React.StrictMode>,
);