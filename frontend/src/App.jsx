import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { SidebarProvider } from './contexts/SidebarContext';
import { useToast } from './hooks/useToast';

import ToastContainer from './pages/Produtos/components/Toast/ToastContainer';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import EsqueciSenha from './pages/EsqueciSenha';
import Vendas from './pages/Vendas';
import Cidades from './pages/Cidades';

const Produtos = lazy(() => import('./pages/Produtos'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  
  const isAuthenticated = !!localStorage.getItem('token');
  const { toasts, removeToast, addToast} = useToast();

  return (

    <SidebarProvider>
      
      <BrowserRouter>
      <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%', fontSize: '24px', color: '#02323C', fontFamily: 'Poppins', fontWeight: '700'}}> Carregando...</div>}>
        
        <Routes>
          
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} /> 
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />

          <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" /> } />
          <Route path="/produtos" element={isAuthenticated ? <Produtos /> : <Navigate to="/login" /> } />
          <Route path="/vendas" element={isAuthenticated ? <Vendas /> : <Navigate to="/login" />} />
          <Route path="/cidades" element={<Cidades addToast={addToast} />} />
        
        </Routes>  

      </Suspense>

      <ToastContainer toasts={toasts} onClose={removeToast} />

      </BrowserRouter>
    </SidebarProvider>

  );
}

export default App;
