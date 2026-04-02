import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const Login = lazy(() => import('./pages/Login'));
const Cadastro = lazy(() => import('./pages/Cadastro'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  
  const isAuthenticated = !!localStorage.getItem('token');

  return (

    <BrowserRouter>
    <Suspense fallback={<div> Carregando...</div>}>
      
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" /> } />
      </Routes>  

    </Suspense>  
    </BrowserRouter>

  );
}

export default App;
