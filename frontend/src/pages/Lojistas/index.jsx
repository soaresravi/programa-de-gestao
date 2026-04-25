import React, { useState } from 'react';
import { Plus, Trash, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { useSidebar } from '../../contexts/SidebarContext';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';
import styles from './Lojistas.module.scss';

const Lojistas = ({ addToast }) => {

    const { isExpanded } = useSidebar();

    const [modalAberto, setModalAberto] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [formData, setFormData] = useState({ nome: '' });
    const [excluindoId, setExcluindoId] = useState(null);
    const [loading, setLoading] = useState(false);

    const { data: lojistas, isLoading, refetch } = useQuery({
       
        queryKey: ['lojistas'],

        queryFn: async () => {
            const response = await api.get('/lojistas');
            return response.data;
        },

    });

    const abrirModal = (lojista = null) => {

        if (lojista) {
            setEditandoId(lojista.id);
            setFormData({ nome: lojista.nome });
        } else {
            setEditandoId(null);
            setFormData({ nome: '' });
        }

        setModalAberto(true);

    };

    const fecharModal = () => {
        setModalAberto(false);
        setEditandoId(null);
        setFormData({ nome: '' });
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!formData.nome.trim()) {
            addToast('Por favor, informe o nome do lojista', 'error');
            return;
        }

        setLoading(true);

        const data = {
            nome: formData.nome.trim()
        };

        try {

            if (editandoId) {
                await api.put(`/lojistas/${editandoId}`, data);
                addToast('Lojista atualizado com sucesso!', 'success');
            } else {
                await api.post('/lojistas', data);
                addToast('Lojista adicionado com sucesso!', 'success');
            }

            refetch();
            fecharModal();

        } catch (error) {
            console.error('Erro ao salvar lojista:', error);
            addToast(error.response?.data?.message || 'Erro ao salvar lojista. Tente novamente.', 'error');
        } finally {
            setLoading(false);
        }
   
    };

    const handleExcluir = async () => {

        setLoading(true);

        try {

            await api.delete(`/lojistas/${excluindoId}`);
            addToast('Lojista excluído com sucesso!', 'success');
            refetch();
            setExcluindoId(null);

        } catch (error) {
            console.error('Erro ao excluir lojista:', error);
            addToast(error.response?.data?.message || 'Erro ao excluir lojista. Tente novamente.', 'error');
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
                    <h1 className={styles.title}>Lojistas</h1>
                    <p className={styles.subtitle}>Gerencie os lojistas que compram seus produtos</p>
                </div>
                
                <button className={styles.novoLojistaBtn} onClick={() => abrirModal()}> <Plus size={20} strokeWidth={2.5} /> Novo lojista </button>
            
            </div>

            {isLoading ? (
                <div className={styles.loading}>Carregando...</div>
            ) : lojistas?.length === 0 ? (
                <div className={styles.vazio}>Nenhum lojista cadastrado</div>
            ) : (
                
                <div className={styles.lista}>
                    
                    {lojistas?.map((lojista) => (
                        
                        <div key={lojista.id} className={styles.lojistaCard}>
                            
                            <div className={styles.lojistaInfo}>
                                
                                <h3 className={styles.lojistaNome}>{lojista.nome}</h3>
                                
                                <div className={styles.lojistaStats}>
                                    
                                    <div className={styles.statItem}>
                                        <span className={styles.statLabel}>Total gasto:</span>
                                        <span className={styles.statValue}> R$ {(lojista.totalGasto || 0).toFixed(2)} </span>
                                    </div>
                                    
                                    <div className={styles.statItem}>
                                        <span className={styles.statLabel}>Total de vendas:</span>
                                        <span className={styles.statValue}>{lojista.totalVendas || 0}</span>
                                    </div>

                                </div>
                                
                            </div>
                            
                            <div className={styles.lojistaAcoes}>
                                <button className={styles.editarBtn} onClick={() => abrirModal(lojista)}> Editar </button>
                                <button className={styles.excluirBtn} onClick={() => setExcluindoId(lojista.id)}> <Trash size={20} strokeWidth={2.5} /> </button>
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
                        <h2 className={styles.modalTitle}> {editandoId ? 'Editar lojista' : 'Novo lojista'} </h2>
                        <button className={styles.modalClose} onClick={fecharModal}> <X size={24} /> </button>
                    </div>
                    
                    <div className={styles.divider} />
                        
                    <form onSubmit={handleSubmit} className={styles.modalForm}>
                        
                        <div className={styles.formGroup}>
                            <label>Nome do lojista</label>
                            <input type="text" placeholder="Digite o nome do lojista" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} autoFocus />
                        </div>
                            
                        <button type="submit" className={styles.salvarBtn} disabled={loading}> {loading ? 'Salvando...' : (editandoId ? 'Salvar alterações' : 'Adicionar lojista')} </button>
                    
                    </form>

                </div>
            </div>
        )}

        {excluindoId && (
            
            <div className={styles.modalOverlay} onClick={() => setExcluindoId(null)}>
                
                <div className={styles.modalConfirm} onClick={(e) => e.stopPropagation()}>
                    
                    <h3>Excluir lojista</h3>
                    <p>Tem certeza que deseja excluir este lojista?</p>
                    
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

export default Lojistas;