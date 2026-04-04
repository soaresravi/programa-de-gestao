import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole, ArrowLeft } from 'lucide-react';

import styles from './EsqueciSenha.module.scss';
import api from '../../services/api';

const EtapaCodigo = ({ email, codigo, setCodigo, avancar, voltar }) => {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [reenviando, setReenviando] = useState(false);
  const [success, setSuccess] = useState('');
  const inputs = useRef([]);
  const [digitos, setDigitos] = useState(['', '', '', '', '', '']);

  useEffect(() => {
    const codigoCompleto = digitos.join('');
    setCodigo(codigoCompleto);
  }, [digitos, setCodigo]);

  const handleChange = (index, value) => {

    if (value.length > 1) return;

    const novosDigitos = [...digitos];
    novosDigitos[index] = value;
    setDigitos(novosDigitos);

    if (value && index < 5) {
      inputs.current[index + 1].focus();
    }

  };

  const handleKeyDown = (index, e) => {

    if (e.key === 'Backspace' && !digitos[index] && index > 0) {
      inputs.current[index - 1].focus();
    }

  };

  const handleVerify = async (e) => {

    e.preventDefault();
    setLoading(true);
    setErro('');

    if (codigo.length !== 6) {
      setErro('Digite o código de 6 dígitos');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/verificar-codigo', { email, codigo });
      avancar();
    } catch (error) {
      setErro('Código inválido ou expirado');
    } finally {
      setLoading(false);
    }

  };

  const handleReenviar = async () => {

    setReenviando(true);
    setErro('');
    setSuccess('');

    try {
            
      await api.post('/auth/esqueci-senha', { email });
      setSuccess('Código reenviado! Verifique sua caixa de entrada e spam.');
      setDigitos(['', '', '', '', '', '']);
      inputs.current[0].focus();
        
    } catch (error) {
      setErro('Erro ao reenviar código');
    } finally {
      setReenviando(false);
    }

  };

  return (
  
  <div>
    
    <button onClick={voltar} className={styles.backButton}> <ArrowLeft size={20} /> </button>
    <h2 className={styles.title}>Resete sua senha</h2>
    <p className={styles.subtitleCode}> Digite o código de 6 dígitos enviado no seu email. Não esqueça de verificar sua caixa de Spam! Se não recebeu, talvez seu email não tenha cadastro ativo. </p>
    <p className={styles.emailCode}> {email} </p>
    
    <form onSubmit={handleVerify}>
      
      {erro && <div className={styles.error}>{erro}</div>}
      {success && <div className={styles.success}>{success}</div>}
    
      <div className={styles.codeContainer}>
        
        {digitos.map((digito, index) => (
          <input key={index} ref={(el) => (inputs.current[index] = el)} type="text" maxLength={1} value={digito} onChange={(e) => handleChange(index, e.target.value)} onKeyDown={(e) => handleKeyDown(index, e)} className={styles.codeInput} />
        ))}

      </div>
    
      <button type="submit" className={styles.buttonCode} disabled={loading}>
      
      {loading ? 'Verificando...' : 'Resetar senha'}
      <LockKeyhole size={18} style={{ marginLeft: '8px', marginTop: '6px' }} /> </button>
      <div className={styles.resendLink}> Não recebeu o código?{' '}
      
      <button type="button" onClick={handleReenviar} disabled={reenviando}>
        {reenviando ? 'Enviando...' : 'Enviar novamente'}
      </button> </div>

    </form>
  </div>
  );
};

export default EtapaCodigo;