import React, { useState } from 'react';
import { LockKeyhole, Eye, EyeClosed, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import styles from './EsqueciSenha.module.scss';
import api from '../../services/api';

const EtapaNovaSenha = ({ email, codigo, voltar }) => {

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {

    e.preventDefault();
    setLoading(true);
    setErro('');

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (novaSenha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/redefinir-senha', { email, codigo, novaSenha });
      navigate('/login');
    } catch (error) {
      setErro('Erro ao redefinir senha. Tente novamente.');
    } finally {
      setLoading(false);
    }

  };

  return (
  
  <div>
          
    <button onClick={voltar} className={styles.backButton}> <ArrowLeft size={20} /> </button>

    <h2 className={styles.title}>Nova senha</h2>
    <p className={styles.subtitle}> Digite sua nova senha abaixo </p>
    
    <form onSubmit={handleSubmit}>
      
      {erro && <div className={styles.error}>{erro}</div>}
    
      <div className={styles.inputGroup}>     
        <LockKeyhole className={styles.inputIcon} size={20} />
        <input type={showNovaSenha ? 'text' : 'password'} placeholder="Nova senha" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className={styles.input} required />
        <button type="button" className={styles.eyeButton} onClick={() => setShowNovaSenha(!showNovaSenha)}> {showNovaSenha ? <EyeClosed size={20} /> : <Eye size={20} />} </button>
      </div>
    
      <div className={styles.inputGroup}>
        <LockKeyhole className={styles.inputIcon} size={20} />
        <input type={showConfirmarSenha ? 'text' : 'password'} placeholder="Confirmar senha" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} className={styles.input} required />
        <button type="button" className={styles.eyeButton} onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}> {showConfirmarSenha ? <EyeClosed size={20} /> : <Eye size={20} />} </button>
      </div>
    
      <button type="submit" className={styles.button} disabled={loading}> {loading ? 'Alterando...' : 'Alterar senha'} </button>
    
      <div className={styles.link}> Lembrou sua senha? <a href="/login">Faça login</a> </div>

    </form>
  </div>
  );
};

export default EtapaNovaSenha;