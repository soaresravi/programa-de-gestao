import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import Select from 'react-select';

import Sidebar from '../../components/Sidebar';
import { useSidebar } from '../../contexts/SidebarContext';
import EstoqueCard from './EstoqueCard';
import styles from './EstoqueLoja.module.scss';
import api from '../../services/api';

const EstoqueLoja = ({ addToast }) => {

    const { isExpanded } = useSidebar();
    const [loading, setLoading] = useState(false);

    const [estoque, setEstoque] = useState([]);
    const [produtos, setProdutos] = useState([]);
    const [modalAberto, setModalAberto] = useState(false);
    const [editandoItem, setEditandoItem] = useState(null);
    const [excluindoId, setExcluindoId] = useState(null);
    const [formData, setFormData] = useState({ produtoId: '', quantidade: '' });

    const carregarDados = async () => {

        try {
            
            const [resEstoque, resProdutos] = await Promise.all([
                api.get('/estoque'),
                api.get('/produtos')
            ]);
    
            setEstoque(resEstoque.data);
            setProdutos(resProdutos.data);

        } catch (error) {
            console.error('Erro ao carregar dados do estoque:', error);
            addToast(error.response?.data?.message || 'Erro ao carregar dados do estoque', 'error');
        }
        
    };

    useEffect(() => { carregarDados(); }, []);

    const produtosDisponiveis = produtos.filter(p => !estoque.some(e => e.produtoId === p.id) || (editandoItem && p.id === editandoItem.produtoId));

    const handleSubmit = async (e) => {

        e.preventDefault();
        setLoading(true);

        try {

            if (editandoItem) {
                await api.put(`/estoque/${editandoItem.id}`, { quantidade: formData.quantidade });
                addToast('Estoque atualizado com sucesso!', 'success');
            } else {
                await api.post('/estoque', formData);
                addToast('Produto adicionado ao estoque!', 'success');
            }

            setModalAberto(false);
            carregarDados();

        } catch (error) {
            console.error('Erro ao salvar alteração:', error);
            addToast(error.response?.data?.message || 'Erro ao salvar alteração. Tente novamente.', 'error');
        } finally {
            setLoading(false);
        }

    };

    const handleExcluir = async () => {
        
        if (!excluindoId) return;
        setLoading(true);

        try {
            
            await api.delete(`/estoque/${excluindoId}`);
            addToast('Produto removido do estoque com sucesso!', 'success');
            setExcluindoId(null);
            setModalAberto(false);
            carregarDados();

        } catch (error) {
            console.error('Erro ao remover produto do estoque:', error);
            addToast(error.response?.data?.message || 'Erro ao remover produto do estoque', 'error');
        } finally {
            setLoading(false);
        }

    };

    const customStyles = {
        
        control: (base) => ({
          
            ...base,
            backgroundColor: '#F0F8F0',
            border: 'none',
            borderRadius: '8px',
            minHeight: '36px',
            height: '36px',
            boxShadow: 'none',
           
            '&:hover': {
                border: 'none',
            }
        }),

        menu: (base) => ({
            ...base,
            borderRadius: '8px',
            overflow: 'hidden',
            zIndex: 20,
        }),

        valueContainer: (base) => ({
            ...base,
            padding: '0 8px',
        }),

        indicatorsContainer: (base) => ({
            ...base,
            height: '34px',
        }),

        option: (base, { isFocused }) => ({
            ...base,
            backgroundColor: isFocused ? 'rgba(34, 197, 94, 0.1)' : 'white',
            color: '#333',
            cursor: 'pointer',
        }),

        placeholder: (base) => ({
            ...base,
            color: '#999',
        }),

        input: (base) => ({
            ...base,
            color: '#333',
        }),

    };

    return (
    
    <div className={styles.container}>
        
        <Sidebar />
        
        <div className={styles.content} style={{ marginLeft: isExpanded ? '250px' : '70px' }}>
            
            <div className={styles.header}>
            
                <div>
                    <h1 className={styles.title}>Estoque da loja</h1>
                    <p className={styles.subtitle}>Gerencie os produtos disponíveis na sua loja física</p>
                </div>
                
                <button className={styles.novoEstoqueBtn} onClick={() => {
                    setEditandoItem(null);
                    setFormData({ produtoId: '', quantidade: '' });
                    setModalAberto(true);
                }}> <Plus size={20} strokeWidth={2.5} /> Adicionar estoque </button>
            
            </div>

            <div className={styles.gridCards}>
                
                {estoque.map(item => (
                    
                    <EstoqueCard key={item.id} item={item} onClick={() => {
                        setEditandoItem(item);
                        setFormData({ produtoId: item.produtoId, quantidade: item.quantidade });
                        setModalAberto(true);
                    }} />

                ))}

            </div>

            {modalAberto && (
            
                <div className={styles.modalOverlay} onClick={() => setModalAberto(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>{editandoItem ? 'Editar estoque' : 'Novo produto'}</h2>
                            <button className={styles.modalClose} onClick={() => setModalAberto(false)}><X size={24} /></button>
                        </div>
                        
                        <div className={styles.divider} />
                        
                        <form onSubmit={handleSubmit} className={styles.modalForm}>
                            
                            {editandoItem ? (
                            
                                <div className={styles.previewItem}>
                                    
                                    <img src={editandoItem.produtoFoto || 'placeholder.png'} alt={editandoItem.produtoNome} />
                                    
                                    <div className={styles.previewInfo}>
                                        
                                        <strong>{editandoItem.produtoNome}</strong>
                                        
                                        <div className={styles.precosPreview}>
                                            <span className={styles.labelValor}>Valor unitário: R$ {editandoItem.produtoPreco?.toFixed(2)}</span>
                                            <span className={styles.labelTotalModal}> Total em estoque: R$ {(editandoItem.produtoPreco * formData.quantidade).toFixed(2)} </span>
                                        </div>

                                    </div>
                                
                                </div>
                            
                            ) : (
                            
                                <div className={styles.formGroupProduto}>
                                    <label>Produto:</label>
                                    <Select options={produtosDisponiveis.map(p => ({ value: p.id, label: p.nome }))} placeholder="Buscar produto..."  isClearable styles={customStyles} onChange={(option) => setFormData({...formData, produtoId: option ? option.value : ''})} noOptionsMessage={() => 'Nenhum produto encontrado'} />
                                </div>

                            )}
                            
                            <div className={styles.formGroup}>
                                <label>Quantidade em loja</label>
                                <input type="number" value={formData.quantidade} onChange={e => setFormData({...formData, quantidade: e.target.value})} required placeholder="0" autoFocus={!!editandoItem} />
                            </div>
                            
                            <button type="submit" className={styles.salvarBtn} disabled={loading}> {loading ? 'Salvando...' : (editandoItem ? 'Salvar alterações' : 'Adicionar ao estoque')} </button>
                            
                            {editandoItem && (
                                <button type="button" className={styles.excluirBtnTexto} onClick={() => setExcluindoId(editandoItem.id)}> Excluir produto da loja </button>
                            )}

                        </form>
                    </div>
                </div>
            )}
        </div>

        {excluindoId && (
        
            <div className={styles.modalOverlay} onClick={() => setExcluindoId(null)}>
                
                <div className={styles.modalConfirm} onClick={(e) => e.stopPropagation()}>
                    
                    <h3>Remover do estoque</h3>
                    <p>Tem certeza que deseja remover este produto do estoque da loja?</p>
                    
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

export default EstoqueLoja;