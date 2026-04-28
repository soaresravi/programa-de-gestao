import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Eye, EyeClosed } from 'lucide-react';

import { useSidebar } from '../../contexts/SidebarContext';
import Sidebar from '../../components/Sidebar';
import ConfirmacaoModal from '../Produtos/components/ModalProduto/ConfirmacaoModal';
import api from '../../services/api';
import styles from './Configuracoes.module.scss';

const Configuracoes = ({ addToast, onLogout }) => {

    const {isExpanded } = useSidebar();
    const navigate = useNavigate();

    const [usuario, setUsuario] = useState({ nome: '', email: '' });
    const [loading, setLoading] = useState(false);
    const [loadingSenha, setLoadingSenha] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ nome: '', email: '' });
    const [confirmarLogoutAberto, setConfirmarLogoutAberto] = useState(false);
    const [confirmarExclusaoAberto, setConfirmarExclusaoAberto] = useState(false);
    const [senhaConfirmacao, setSenhaConfirmacao] = useState('');
    const [excluindo, setExcluindo] = useState(false);
    const [showSenhaAtual, setShowSenhaAtual] = useState(false);
    const [showNovaSenha, setShowNovaSenha] = useState(false);
    const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
    
    const [senhaData, setSenhaData] = useState({
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: ''
    });

    useEffect(() => {
        
        let isMounted = true;
        
        const fetch = async () => {
           
            try {

                const token = localStorage.getItem('token');

                let nome = null;
                let email = null;

                if (token) {

                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        nome = payload.nome;
                        email = payload.upn;
                    } catch (error) {
                        console.error('Erro ao decodificar token', error);
                    }

                }

                if (nome && email) {

                    if (isMounted) {
                        setUsuario({ nome, email });
                        setFormData({ nome, email });
                    }

                } else {
                    
                    const response = await api.get('/auth/me');
               
                    if (isMounted) {
                        setUsuario(response.data);
                        setFormData({ nome: response.data.nome, email: response.data.email });
                    }

                }
                
            } catch (error) {

                if (isMounted && error.response?.status !== 401) {
                    addToast('Erro ao carregar dados', 'error');
                }

            }

        };
    
        fetch();
        return () => { isMounted = false; };

    }, []);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setFormData({ nome: usuario.nome, email: usuario.email });
        setIsEditing(false);
    };

    const handleSaveProfile = async () => {

        if (!formData.nome.trim()) {
            addToast('Nome não pode estar vazio', 'error');
            return;
        }

        setLoading(true);

        try {

            await api.put('/auth/me', {
                nome: formData.nome,
                email: formData.email
            });

            addToast('Perfil atualizado com sucesso!', 'success');
            setUsuario({ ...usuario, nome: formData.nome, email: formData.email });
            setIsEditing(false);

        } catch (error) {
            console.error('Erro ao salvar perfil:', error);
            addToast(error.response?.data?.message || 'Erro ao salvar alterações', 'error');
        } finally {
            setLoading(false);
        }
    
    };

    const handleChangePassword = async () => {

        if (!senhaData.senhaAtual) {
            addToast('Digite sua senha atual', 'error');
            return;
        }

        if (!senhaData.novaSenha) {
            addToast('Digite a nova senha', 'error');
            return;
        }

        if (senhaData.novaSenha !== senhaData.confirmarSenha) {
            addToast('Nova senha e confirmação não coincidem', 'error');
            return;
        }

        if (senhaData.novaSenha.length < 6) {
            addToast('A nova senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }

        setLoadingSenha(true);

        try {

            await api.put('/auth/me', {
                senhaAtual: senhaData.senhaAtual,
                novaSenha: senhaData.novaSenha
            });

            addToast('Senha alterada com sucesso!', 'success');
            setSenhaData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
           
            setShowSenhaAtual(false);
            setShowNovaSenha(false);
            setShowConfirmarSenha(false);

        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            addToast(error.response?.data?.message || 'Erro ao alterar senha', 'error');
        } finally {
            setLoadingSenha(false);
        }

    };

    const handleLogout = () => {

        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');

        if (onLogout) onLogout();
        navigate('/login');
        addToast('Logout realizado com sucesso!', 'success');

    };

    const handleExcluirConta = async () => {

        if (!senhaConfirmacao) {
            addToast('Digite sua senha para confirmar a exclusão', 'error');
            return;
        }

        setExcluindo(true);

        try {

            await api.delete('/auth/me', {
                data: { senha: senhaConfirmacao }
            });

            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');

            navigate('/login');
            addToast('Conta excluída com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao excluir conta:', error);
            addToast(error.response?.data?.message || 'Senha incorreta ou erro ao excluir conta', 'error');
            setSenhaConfirmacao('');
        } finally {
            setExcluindo(false);
            setConfirmarExclusaoAberto(false);
        }
    
    };

    return (
    
    <div className={styles.container}>
        
        <Sidebar />
            
        <div className={styles.content} style={{ marginLeft: isExpanded ? '250px' : '70px' }}>
            
            <div className={styles.header}>
                <h1 className={styles.title}>Configurações</h1>
                <p className={styles.subtitle}>Gerencie suas informações de conta</p>
            </div>

            <div className={styles.section}>
                
                <h2 className={styles.sectionTitle}>Informações pessoais</h2>
            
                <div className={styles.card}>
                    
                    <div className={styles.formGroup}>
                        
                        <label>Nome</label>
                        
                        {isEditing ? (
                            <input type="text" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
                        ) : (
                            <div className={styles.infoValue}>{usuario.nome}</div>
                        )}
                    
                    </div>
                        
                    <div className={styles.formGroup}>
                        
                        <label>Email</label>
                        
                        {isEditing ? (
                            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        ) : (
                            <div className={styles.infoValue}>{usuario.email}</div>
                        )}

                    </div>

                    <div className={styles.buttonGroup}>
                        
                        {isEditing ? (
                        
                        <>
                            <button className={styles.cancelBtn} onClick={handleCancelEdit}> Cancelar </button>
                            <button className={styles.saveBtn} onClick={handleSaveProfile} disabled={loading}> <Save size={18} /> {loading ? 'Salvando...' : 'Salvar alterações'} </button>
                        </>

                        ) : (
                            <button className={styles.editBtn} onClick={handleEdit}> Editar informações </button>
                        )}

                    </div>
                </div>
            </div>

            <div className={styles.section}>
                
                <h2 className={styles.sectionTitle}>Alterar senha</h2>
            
                <div className={styles.card}>
                    
                    <div className={styles.formGroup}>
            
                        <label>Senha atual</label>
            
                        <div className={styles.passwordWrapper}>
                            <input type={showSenhaAtual ? 'text' : 'password'} placeholder="Digite sua senha atual" value={senhaData.senhaAtual} onChange={(e) => setSenhaData({ ...senhaData, senhaAtual: e.target.value })} />
                            <button type="button" className={styles.eyeButton} onClick={() => setShowSenhaAtual(!showSenhaAtual)}> {showSenhaAtual ? <EyeClosed size={18} /> : <Eye size={18} />} </button>
                        </div>
                    
                    </div>
                        
                    <div className={styles.formGroup}>
                        
                        <label>Nova senha</label>
                    
                        <div className={styles.passwordWrapper}>
                            <input type={showNovaSenha ? 'text' : 'password'} placeholder="Digite a nova senha (mínimo 6 caracteres)" value={senhaData.novaSenha} onChange={(e) => setSenhaData({ ...senhaData, novaSenha: e.target.value })} />
                            <button type="button" className={styles.eyeButton} onClick={() => setShowNovaSenha(!showNovaSenha)}> {showNovaSenha ? <EyeOff size={18} /> : <Eye size={18} />} </button>
                        </div>

                    </div>
                        
                    <div className={styles.formGroup}>
                        
                        <label>Confirmar nova senha</label>
                    
                        <div className={styles.passwordWrapper}>     
                            <input type={showConfirmarSenha ? 'text' : 'password'} placeholder="Confirme a nova senha" value={senhaData.confirmarSenha} onChange={(e) => setSenhaData({ ...senhaData, confirmarSenha: e.target.value })} />
                            <button type="button" className={styles.eyeButton} onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}> {showConfirmarSenha ? <EyeOff size={18} /> : <Eye size={18} />} </button>
                        </div>
                        
                    </div>
                        
                    <div className={styles.buttonGroup}>
                        <button className={styles.saveBtn} onClick={handleChangePassword} disabled={loadingSenha}> {loadingSenha ? 'Alterando...' : 'Alterar senha'} </button>
                    </div>

                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.card} style={{ backgroundColor: 'transparent', boxShadow: 'none'}}>
                    <button className={styles.logoutBtn} onClick={() => setConfirmarLogoutAberto(true)}> Sair da conta </button>
                    <button className={styles.deleteBtn} onClick={() => setConfirmarExclusaoAberto(true)}> Excluir minha conta </button>
                </div>
            </div>

        </div>

        <ConfirmacaoModal isOpen={confirmarLogoutAberto} onClose={() => setConfirmarLogoutAberto(false)} onConfirm={handleLogout} title="Sair da conta" message="Tem certeza que deseja sair da sua conta?" />

        {confirmarExclusaoAberto && (
            
            <div className={styles.modalOverlay} onClick={() => setConfirmarExclusaoAberto(false)}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    
                    <div className={styles.modalHeader}>
                        <h2 className={styles.modalTitle}>Excluir conta</h2>
                        <button className={styles.modalClose} onClick={() => setConfirmarExclusaoAberto(false)}> <X size={24} /> </button>
                    </div>
                    
                    <div className={styles.divider} /> 
                    <div className={styles.modalForm}>
                            
                        <p className={styles.warningText}> Esta ação é irreversível! Todos os seus dados serão permanentemente excluídos. </p>
                        
                        <div className={styles.formGroup}>
                            <label>Digite sua senha para confirmar</label>
                            <input type="password" placeholder="Sua senha" value={senhaConfirmacao} onChange={(e) => setSenhaConfirmacao(e.target.value)} autoFocus />
                        </div>
                            
                        <div className={styles.modalButtons}>
                            <button className={styles.cancelarBtn} onClick={() => setConfirmarExclusaoAberto(false)}> Cancelar </button>
                            <button className={styles.deleteConfirmBtn} onClick={handleExcluirConta} disabled={excluindo}> {excluindo ? 'Excluindo...' : 'Excluir minha conta'} </button>
                        </div>

                    </div>
                </div>
            </div>
        )}
    </div>
    );
};

export default Configuracoes;