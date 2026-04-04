import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import EsqueciSenha from './pages/EsqueciSenha';

const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  
  const isAuthenticated = !!localStorage.getItem('token');

  return (

    <BrowserRouter>
    <Suspense fallback={<div> Carregando...</div>}>
      
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" /> } />
        <Route path="/cadastro" element={<Cadastro />} /> 
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
      </Routes>  

    </Suspense>  
    </BrowserRouter>

  );
}

export default App;
