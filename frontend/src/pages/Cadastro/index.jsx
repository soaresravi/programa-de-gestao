import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound, Mail, LockKeyhole, Eye, EyeClosed } from 'lucide-react';
import { useForm } from 'react-hook-form';

import api from '../../services/api';
import styles from './Cadastro.module.scss';

const Cadastro = ({ showError, showSuccess }) => {

  const navigate = useNavigate();
    
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const { register, handleSubmit, watch, formState: { errors }, } = useForm();
  const senha = watch('senha');

  const onSubmit = async (data) => {

    setLoading(true);
    setErro('');

    try {

      await api.post('/auth/registro', {
        nome: data.nome,
        email: data.email,
        senha: data.senha,
      });

      const loginResponse = await api.post('/auth/login', {
        email: data.email,
        senha: data.senha,
      });

      localStorage.setItem('token', loginResponse.data.token);
      localStorage.setItem('refreshToken', loginResponse.data.refreshToken);

      if (showSuccess) showSuccess('Cadastro realizado com sucesso!');

      setTimeout(() => {
        window.location.href = '/';
      }, 100);

    } catch (error) {
      
      console.error('Erro no cadastro:', error);
      setErro = error.response?.data || 'Erro ao criar conta';
      setErro(mensagem);
      if (showError) showError(mensagem);

    } finally {
      setLoading(false);
    }

  };

  return (
        
    <div className={styles.container}>    
      <div className={styles.card}>
            
        <div className={styles.leftPanel}>

          <div className={styles.leftContent}>
            <h1>Seja bem-vindo!</h1>
            <p>Para começar a utilizar seu programa de gestão, crie uma conta. Já tem?</p>
            <button className={styles.loginButton} onClick={() => navigate('/login')}> Faça login </button>
          </div>

        </div>
            
        <div className={styles.rightPanel}>        
          <div className={styles.formContainer}>
                
            <h2 className={styles.title}>Criar conta</h2>
                
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                
              {erro && <div className={styles.error}>{erro}</div>}
                
              <div className={styles.inputGroup}>
                  
                <UserRound className={styles.inputIcon} size={20} />
                  
                <input type="text" placeholder="Nome" className={styles.input} {...register('nome', { required: 'Nome é obrigatório',
                  
                pattern: {
                  value: /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/, message: 'Nome deve conter apenas letras'
                } })} />

              </div>
                
              {errors.nome && <span className={styles.errorText}>{errors.nome.message}</span>}
                
              <div className={styles.inputGroup}>
                  
                <Mail className={styles.inputIcon} size={20} />
                  
                <input type="email" placeholder="Email" className={styles.input} {...register('email', { required: 'Email é obrigatório',
                 
               pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email inválido'
                }})} />

              </div>
                
              {errors.email && <span className={styles.errorText}>{errors.email.message}</span>}
                
              <div className={styles.inputGroup}>
                  
                <LockKeyhole className={styles.inputIcon} size={20} />
                  
                <input type={showPassword ? 'text' : 'password'} placeholder="Senha" className={styles.input} {...register('senha', { required: 'Senha é obrigatória',
                  
                minLength: {
                  value: 6,
                  message: 'Senha deve ter no mínimo 6 caracteres'
                } })} />

                <button type="button" className={styles.eyeButton} onClick={() => setShowPassword(!showPassword)}> {showPassword ? <EyeClosed size={20} /> : <Eye size={20} />} </button>
                
              </div>
                
              {errors.senha && <span className={styles.errorText}>{errors.senha.message}</span>}
                
              <div className={styles.inputGroup}>
                  
                <LockKeyhole className={styles.inputIcon} size={20} />
                  
                <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirmar senha" className={styles.input}
                {...register('confirmarSenha', { required: 'Confirme sua senha', validate: value => value === senha || 'As senhas não coincidem' })} />
                  
                <button type="button" className={styles.eyeButton} onClick={() => setShowConfirmPassword(!showConfirmPassword)}> {showConfirmPassword ? <EyeClosed size={20} /> : <Eye size={20} />} </button>

              </div>

              {errors.confirmarSenha && <span className={styles.errorText}>{errors.confirmarSenha.message}</span>}
                
              <button type="submit" className={styles.button} disabled={loading}> {loading ? 'Cadastrando...' : 'Cadastrar'} </button>
              
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cadastro;