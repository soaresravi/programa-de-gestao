import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import api from '../../services/api';
import styles from './EsqueciSenha.module.scss';

const EtapaEmail = ({ email, setEmail, avancar }) => {

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {

    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      await api.post('/auth/esqueci-senha', { email });
      avancar();
    } catch (error) {
      setErro('Erro ao enviar código. Tente novamente.');
    } finally {
      setLoading(false);
    }

  };

  return (
  
  <div>
    
    <h2 className={styles.title}>Esqueceu a senha?</h2>
    <p className={styles.subtitle}> Digite o email cadastrado ao criar sua conta. Iremos enviar um código para confirmar sua identidade e após isso você pode redefinir sua senha. </p>
    
    <form onSubmit={handleSubmit}>
      
      {erro && <div className={styles.error}>{erro}</div>}
    
      <div className={styles.inputGroup}>     
        <Mail className={styles.inputIcon} size={20} />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={styles.input} required />
      </div>

      <button type="submit" className={styles.button} disabled={loading}> {loading ? 'Enviando...' : 'Enviar código'} </button>
      <div className={styles.link}> Lembrou sua senha? <a href="/login">Faça login</a> </div>

    </form>
  </div>
  );
};
    
export default EtapaEmail;