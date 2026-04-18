import React, { useState } from 'react';
import { Plus, Trash, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { useSidebar } from '../../contexts/SidebarContext';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';
import styles from './Cidades.module.scss';

const Cidades = ({ addToast }) => {

    const { isExpanded } = useSidebar();

    const [modalAberto, setModalAberto] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [formData, setFormData] = useState({ nome: '', valorFrete: '' });
    const [excluindoId, setExcluindoId] = useState(null);
    const [loading, setLoading] = useState(false);

    const { data: cidades, isLoading, refetch } = useQuery({
        
        queryKey: ['cidades'],
        
        queryFn: async () => {
            const response = await api.get('/cidades');
            return response.data;
        },

    });

    const abrirModal = (cidade = null) => {
       
        if (cidade) {
            setEditandoId(cidade.id);
            setFormData({ nome: cidade.nome, valorFrete: cidade.valorFrete });
        } else {
            setEditandoId(null);
            setFormData({ nome: '', valorFrete: '' });
        }

        setModalAberto(true);

    };

    const fecharModal = () => {
        setModalAberto(false);
        setEditandoId(null);
        setFormData({ nome: '', valorFrete: '' });
    };

    const handleSubmit = async (e) => {
        
        e.preventDefault();
        
        if (!formData.nome) {
            addToast('Por favor, informe o nome da cidade', 'error'); 
            return;
        }
          
        if (formData.valorFrete === '' || formData.valorFrete === null) {
            addToast('Por favor, informe o valor do frete', 'error');
            return;
        }

        setLoading(true);

        const data = {
            nome: formData.nome,
            valorFrete: parseFloat(formData.valorFrete) || 0
        };

        try {
           
            if (editandoId) {
                await api.put(`/cidades/${editandoId}`, data);
                addToast('Cidade atualizada com sucesso!', 'success');
            } else {
                await api.post('/cidades', data);
                addToast('Cidade adicionada com sucesso!', 'success');
            }

            refetch();
            fecharModal();

        } catch (error) {
            console.error('Erro ao salvar cidade:', error);
            addToast(error.response?.data?.message || 'Erro ao salvar cidade. Tente novamente.', 'error');
        } finally {
            setLoading(false);
        }

    };

    const handleExcluir = async () => {
       
        setLoading(true);
       
        try {
          
            await api.delete(`/cidades/${excluindoId}`);
            addToast('Cidade excluída com sucesso!', 'success');
            refetch();
            setExcluindoId(null);
     
        } catch (error) {
            console.error('Erro ao excluir cidade:', error);
            addToast(error.response?.data?.message || 'Erro ao excluir cidade. Tente novamente.', 'error'); 
        } finally {
            setLoading(false);
        }

    };

    return (
    
    <div className={styles.container}>
        
        <Sidebar />
        
        <div className={styles.content} style={{ marginLeft: isExpanded ? '250px' : '70px' }}>
            
            <div className={styles.header}>
                
                <div>
                    <h1 className={styles.title}>Cidades e frete</h1>
                    <p className={styles.subtitle}>Gerencie as cidades e valores de frete para entrega</p>
                </div>
                
                <button className={styles.novaCidadeBtn} onClick={() => abrirModal()}> <Plus size={20} strokeWidth={2.5} /> Adicionar frete </button>
            
            </div>

            {isLoading ? (
                <div className={styles.loading}>Carregando...</div>
            ) : cidades?.length === 0 ? (
                <div className={styles.vazio}>Nenhuma cidade para entrega cadastrada</div>
            ) : (
                
                <div className={styles.lista}>
                    
                    {cidades?.map((cidade) => (
                        
                        <div key={cidade.id} className={styles.cidadeItem}>
                            
                            <div className={styles.cidadeInfo}>
                                <span className={styles.cidadeNome}>{cidade.nome}</span>
                                <span className={`${styles.cidadeFrete} ${cidade.valorFrete === 0 ? styles.freteGratis : ''}`}> {cidade.valorFrete === 0 ? 'Frete grátis' : `R$ ${cidade.valorFrete.toFixed(2)}`} </span>
                            </div>
                            
                            <div className={styles.cidadeAcoes}>
                                <button className={styles.editarBtn} onClick={() => abrirModal(cidade)}> Editar </button>
                                <button className={styles.excluirBtn} onClick={() => setExcluindoId(cidade.id)}> <Trash size={20} strokeWidth={2.5} /> </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        
        {modalAberto && (
            
            <div className={styles.modalOverlay} onClick={fecharModal}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    
                    <div className={styles.modalHeader}>
                        <h2 className={styles.modalTitle}> {editandoId ? 'Editar cidade' : 'Nova cidade'} </h2>
                        <button className={styles.modalClose} onClick={fecharModal}> <X size={24} /> </button>
                    </div>
                    
                    <div className={styles.divider} />
                        
                    <form onSubmit={handleSubmit} className={styles.modalForm}>
                        
                        <div className={styles.formGroup}>
                            <label>Cidade</label>
                            <input type="text" placeholder="Ex: São Paulo" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} autoFocus />
                        </div>
                            
                        <div className={styles.formGroup}>
                            <label>Valor do frete (R$)</label>
                            <input type="number" step="0.01" placeholder="0,00 (frete grátis)" value={formData.valorFrete} onChange={(e) => setFormData({ ...formData, valorFrete: e.target.value })} />
                        </div>
                            
                        <button type="submit" className={styles.salvarBtn} disabled={loading}> {loading ? 'Salvando...' : (editandoId ? 'Salvar alterações' : 'Adicionar cidade')} </button>
                        
                    </form>
                </div>
            </div>
        )}

        {excluindoId && (
        
            <div className={styles.modalOverlay} onClick={() => setExcluindoId(null)}>
                <div className={styles.modalConfirm} onClick={(e) => e.stopPropagation()}>
                        
                        <h3>Excluir cidade</h3>
                        <p>Tem certeza que deseja excluir este frete?</p>
                       
                        <div className={styles.confirmActions}>
                            <button className={styles.cancelarBtn} onClick={() => setExcluindoId(null)}> Cancelar </button>
                            <button className={styles.confirmarBtn} onClick={handleExcluir} disabled={loading}> {loading ? 'Excluindo...' : 'Excluir'} </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default Cidades;