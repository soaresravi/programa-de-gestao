import React, { useState } from 'react';
import { Mail, LockKeyhole, Eye, EyeClosed } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import api from '../../services/api';
import styles from './Login.module.scss';
import backgroundImage from '../../assets/image-Photoroom.jpg';

const Login = ({ showError }) => {

    const navigate = useNavigate(); 

    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');

    const handleSubmit = async (e) => {
       
        e.preventDefault();
        setLoading(true);
        setErro('');

        if (!email || !senha) {
            setErro('Preencha todos os campos');
            setLoading(false);
            return;
        }

        try {

            const response = await api.post('/auth/login', { email, senha });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            navigate('/');
        
        } catch (error) {
        
            console.error('Erro no login', error);
            setErro('Email ou senha inválidos');
            if (showError) showError('Email ou senha inválidos');
        
        } finally {
            setLoading(false);
        }

    };

    return (

        <div className={styles.container}>
            
            <div className={styles.overlay}></div>
            <div className={styles.card}>
                
                <div className={styles.cardImage}>
                    <img src={backgroundImage} alt="Fundo da tela de login. Por do som no deserto" />
                </div>
                
                <h2 className={styles.title}>Login</h2>
                
                <form onSubmit={handleSubmit} className={styles.form}>

                   {erro &&
                  
                    <div className={styles.error}> {erro} </div>}
                    
                    <div className={styles.inputGroup}>           
                        <Mail className={styles.inputIcon} size={20} />
                        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={styles.input} required />
                    </div>
                    
                    <div className={styles.inputGroup}>          
                        
                        <LockKeyhole className={styles.inputIcon} size={20} />
                        <input type={showPassword ? 'text' : 'password'} placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} className={styles.input} required />
                        
                        <button type="button" className={styles.eyeButton} onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
                        </button>
                    
                    </div>
                    
                    <div className={styles.forgotPassword}>
                        <a href="/esqueci-senha" sty>Esqueci a senha</a>
                    </div>
                    
                    <button type="submit" className={styles.button} disabled={loading}> {loading ? 'Entrando...' : 'Login'} </button>
            
                    <div className={styles.register}>
                        <a href="/cadastro">Fazer cadastro</a>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default Login;