import React, { useState } from 'react';
import { X, Trash } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Select from 'react-select';

import api from '../../../services/api';
import ModalAddProduto from './ModalAddProduto';
import ConfirmacaoModal from '../../Produtos/components/ModalProduto/ConfirmacaoModal';
import styles from './ModalNovaVenda.module.scss';

const ModalNovaVenda = ({ onClose, onSuccess, addToast }) => {
    
    const [itens, setItens] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showProdutoModal, setShowProdutoModal] = useState(false);
    
    const [lojistaSelecionadoId, setLojistaSelecionadoId] = useState(null);
    const [clienteFinal, setClienteFinal] = useState(true);
    const [data, setData] = useState(new Date().toISOString().split('T')[0]);
    const [cidadeId, setCidadeId] = useState('');
    const [cidadeSearch, setCidadeSearch] = useState('');
    const [vendedor, setVendedor] = useState('');
    const [formaPagamento, setFormaPagamento] = useState('PIX');
    const [parcelas, setParcelas] = useState(1);
    const [origem, setOrigem] = useState('WHATSAPP');
    const [desconto, setDesconto] = useState(0);

    const [confirmarSaidaAberto, setConfirmarSaidaAberto] = useState(false);
    const [confirmarExclusaoItemAberto, setConfirmarExclusaoItemAberto] = useState(false);
    const [itemParaExcluir, setItemParaExcluir] = useState(null);
    const [excluindoId, setExcluindoId] = useState(null);

    const [itemEditando, setItemEditando] = useState(null);
    const [indiceEditando, setIndiceEditando] = useState(null);
    const [dadosEditando, setDadosEditando] = useState(null);

    const { data: cidades } = useQuery({

        queryKey: ['cidades'],

        queryFn: async () => {
            const response = await api.get('/cidades');
            return response.data;
        }

    });

    const { data: lojistas } = useQuery({

        queryKey: ['lojistas'],

        queryFn: async () => {
            const response = await api.get('/lojistas');
            return response.data;
        },

        enabled: !clienteFinal

    });

    const cidadeSelecionada = cidades?.find(c => c.id === parseInt(cidadeId));
    const valorFrete = cidadeSelecionada?.valorFrete || 0;
    const subtotalProdutos = itens.reduce((acc, item) => acc + (item.quantidade * item.precoUnitario), 0);
    const valorComFrete = subtotalProdutos + valorFrete;
    const acrescimoParcelas = formaPagamento === 'CREDITO' && parcelas > 0 ? parcelas * 10 : 0;
    const valorTotalComJuros = valorComFrete + acrescimoParcelas;
    const valorTotal = valorTotalComJuros - desconto;

    const cidadeOptions = cidades?.map(c => ({ 
      value: c.id, 
      label: `${c.nome}`
    })) || [];

    const handleAddProduto = (novoItem) => {
        setItens([...itens, { ...novoItem, id: Date.now() }]);
    };

    const handleRemoveItem = (id) => {
        setItens(itens.filter(item => item.id !== id));
        setExcluindoId(null);
    };

    const handleSubmit = async () => {
      
        if (itens.length === 0) {
            addToast('Adicione pelo menos um produto', 'error');
            return;
        }
    
        if (!cidadeId) {
            addToast('Selecione uma cidade', 'error');
            return;
        }
    
        setLoading(true);

        if (!clienteFinal && (!lojistas || lojistas.length === 0)) {
            addToast('Nenhum lojista cadastrado', 'error');
            setLoading(false);
            return;
        }
    
        const dados = {
         
            data,
            vendedor: vendedor || null,
            lojistaId: !clienteFinal ? lojistaSelecionadoId : null,
            cidadeId: parseInt(cidadeId),
            origem,
            foiNaLoja: origem === 'LOJA_FISICA',
           
            itens: itens.map(item => ({
              
                produtoId: item.produtoId,
                quantidade: item.quantidade,
                precoUnitario: item.precoUnitario,
                custoUnitario: item.custoUnitario,
                modoManual: item.modoManual
         
            })),
         
            formaPagamento,
            parcelas: formaPagamento === 'CREDITO' ? parcelas : null,
            valorFrete,
            valorDesconto: desconto || 0,
            clienteFinal
        };
    
        try {
            
            await api.post('/vendas', dados);
            
            onClose();
            onSuccess();
            addToast('Venda registrada com sucesso!', 'success');

        } catch (error) {
           
            console.error('Erro ao salvar venda:', error);
            const errorMsg = error.response?.data?.message || error.response?.data || 'Erro ao salvar venda';
            addToast(errorMsg, 'error');
      
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setConfirmarSaidaAberto(true);
    };

    const handleConfirmarExclusaoItem = () => {
       
        if (itemParaExcluir) {
            setItens(itens.filter(item => item.id !== itemParaExcluir));
            setItemParaExcluir(null);
        }

        setConfirmarExclusaoItemAberto(false);
   
    };

    const handleExcluirItemClick = (id) => {
        setItemParaExcluir(id);
        setConfirmarExclusaoItemAberto(true);
    };

    const handleEditarItem = (item, index) => {
        setIndiceEditando(index); 
        setItemEditando(item);  
    };
      
    const fecharEdicao = () => {
        setIndiceEditando(null);
        setDadosEditando(null);
    };

    const handleConfirmarEdicao = (itemAtualizado) => {
       
        setItens(itens.map((item, index) => 
            index === indiceEditando ? itemAtualizado : item
        ));
       
        fecharEdicao();
        addToast('Produto atualizado!', 'success');

    };

    return (
    
    <div className={styles.modalOverlay} onClick={handleClose}>
        <div className={styles.modalContainer}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                
                <div className={styles.modalHeader}>
                    
                    <h2 className={styles.modalTitle}>Registrar venda</h2>
                    
                    <div className={styles.headerActions}>
                        <button className={styles.addProdutoBtn} onClick={() => setShowProdutoModal(true)}> + Adicionar produto </button>
                        <button className={styles.modalClose} onClick={handleClose}> <X size={24} /> </button>
                    </div>

                </div>

                <div className={styles.divider} />
                <div className={styles.modalContent}>
                    
                    <div className={styles.listaProdutos}>
                        
                        {itens.map((item, index) => (
                        
                            <div key={item.id || index} className={styles.produtoItem}>
                                
                                <span className={styles.produtoNome}> {item.nome} - Qtd.: {item.quantidade} </span>
                                
                                <div className={styles.produtoAcoes}>
                                    <button className={styles.editarItemBtn} onClick={() => handleEditarItem(item, index)}> Editar </button>
                                    <button className={styles.excluirItemBtn} onClick={() => handleExcluirItemClick(item.id)}> <Trash size={20} strokeWidth={2.5} /> </button>
                                </div>

                            </div>
                        ))}
                    </div>
                    
                    {indiceEditando !== null && (  
                        
                        <div className={styles.containerEdicaoAbaixo}>
                            <ModalAddProduto isEditing={true} initialData={itemEditando} onClose={fecharEdicao} onAdd={handleConfirmarEdicao} addToast={addToast} isLojista={!clienteFinal} />
                        </div>

                    )}
                    
                    <div className={styles.formRow}>
                        
                        <div className={styles.formGroup}>
                            <label>Data:</label>
                            <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={{ width: '120px' }} />
                        </div>
                        
                        <div className={styles.formGroup}>
                            
                            <label>Comprador:</label>
                            
                            <div className={styles.pillContainer}>
                                <button className={`${styles.pill} ${clienteFinal ? styles.active : ''}`} onClick={() => setClienteFinal(true)}>Cliente</button>
                                <button className={`${styles.pill} ${!clienteFinal ? styles.active : ''}`} onClick={() => setClienteFinal(false)}>Lojista</button>
                            </div>

                        </div>
                        
                        {!clienteFinal && (
                        
                            <div className={styles.formGroup}>
                                
                                <label>Lojista:</label>
                                
                                <select value={lojistaSelecionadoId || ''} onChange={(e) => setLojistaSelecionadoId(parseInt(e.target.value))} style={{ width: '80px' }}>
                                    
                                    <option value="">Selecione</option>
                                    
                                    {lojistas?.map(l => (
                                        <option key={l.id} value={l.id}>{l.nome}</option>
                                    ))}

                                </select>

                            </div>
                        )}

                    </div>
                    
                    <div className={styles.formRow}>
                       
                        <div className={styles.formGroupCidade}>
                           
                            <label>Cidade:</label>
                           
                            <Select options={cidadeOptions} placeholder="Selecione..." isClearable value={cidadeId ? { value: cidadeId, label: cidadeSearch } : null}
                            onChange={(option) => {
                                
                                if (option) {
                                    setCidadeId(option.value);
                                    setCidadeSearch(option.label);
                                } else {
                                    setCidadeId('');
                                    setCidadeSearch('');
                                }

                            }} classNamePrefix="select" styles={{ control: (base) => ({ ...base, backgroundColor: '#F0F8F0', border: 'none', borderRadius: '8px', height: '20px', width: '180px' }) }} />
                        
                        </div>
                        
                        <div className={styles.formGroupFrete}>
                            <label>Frete:</label>
                            <span className={styles.freteValor}>R$ {valorFrete.toFixed(2)}</span>
                        </div>
                        
                        <div className={styles.formGroupVendedor}>
                            <label>Vendedor:</label>
                            <input type="text" value={vendedor} onChange={(e) => setVendedor(e.target.value)} style={{ width: '100px' }} />
                        </div>

                    </div>
                    
                    <div className={styles.formRow}>
                        
                        <div className={styles.formGroup}>
                            
                            <label>Foi na loja?</label>
                            
                            <select value={origem} onChange={(e) => setOrigem(e.target.value)}>
                                <option value="LOJA_FISICA">Sim</option>
                                <option value="WHATSAPP">Não</option>
                            </select>

                        </div>
                        
                        <div className={styles.formGroup}>
                            
                            <label>Pagamento:</label>
                            
                            <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} style={{ width: '100px' }}>
                                <option value="PIX">Pix</option>
                                <option value="DINHEIRO">Dinheiro</option>
                                <option value="DEBITO">Débito</option>
                                <option value="CREDITO">Crédito</option>
                            </select>

                        </div>
                        
                        {formaPagamento === 'CREDITO' && (
                        
                            <div className={styles.formGroup}>
                                <label>Parcelas:</label>
                                <select value={parcelas} onChange={(e) => setParcelas(parseInt(e.target.value))} style={{ width: '70px' }}> {[1,2,3,4,5,6,7,8,9,10,11,12].map(p => <option key={p} value={p}>{p}x</option>)} </select>
                            </div>

                        )}

                    </div>
                    
                    <div className={styles.formRow}>
                        
                        <div className={styles.formGroup}>
                            <label className={styles.descontoLabel}>Desconto: (R$)</label>
                            <input type="number" step="0.01" value={desconto} onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)} style={{ width: '80px', color: '#dc2626'}} />
                        </div>

                    </div>
                    
                    <div className={styles.resumoContainer}>
                        
                        {itens.map(item => (
                        
                            <div key={item.id} className={styles.resumoLinha}>
                                <span>{item.quantidade}x {item.nome}:</span>
                                <span className={styles.valorVerde}>R$ {(item.quantidade * item.precoUnitario).toFixed(2)}</span>
                            </div>

                        ))}
                        
                        <div className={styles.resumoDivider} />
                        
                        <div className={styles.resumoLinha}>
                            <span>Total dos produtos:</span>
                            <span className={styles.valorVerde}>R$ {subtotalProdutos.toFixed(2)}</span>
                        </div>
                        
                        <div className={styles.resumoLinha}>
                            <span>Total com frete:</span>
                            <span className={styles.valorVerde}>R$ {valorComFrete.toFixed(2)}</span>
                        </div>
                        
                        {formaPagamento === 'CREDITO' && parcelas > 0 && (
                            
                            <div className={styles.resumoLinha}>
                                <span>Total com parcelamento em {parcelas}x:</span>
                                <span className={styles.valorVerde}>R$ {valorTotalComJuros.toFixed(2)}</span>
                            </div>
                            
                        )}
                        
                        <div className={styles.resumoTotal}>
                            <span style={{ marginRight: '5px'}}>Total com DESCONTO:</span>
                            <span className={styles.valorVerde}>R$ {valorTotal.toFixed(2)}</span>
                        </div>

                    </div>
                    
                    <button className={styles.salvarBtn} onClick={handleSubmit} disabled={loading}> {loading ? 'Salvando...' : 'Salvar venda'} </button>
                
                </div>
            </div>
            
            {showProdutoModal && (
                
                <div className={styles.modalLado}>
                    <ModalAddProduto onClose={() => setShowProdutoModal(false)} onAdd={handleAddProduto} addToast={addToast} isLojista={!clienteFinal} />
                </div>

            )}

        </div>

        <ConfirmacaoModal isOpen={confirmarExclusaoItemAberto} onClose={() => setConfirmarExclusaoItemAberto(false)} onConfirm={handleConfirmarExclusaoItem} title="Excluir produto" message="Tem certeza que deseja remover este produto da venda?" />
       
        <ConfirmacaoModal isOpen={confirmarSaidaAberto} onClose={() => setConfirmarSaidaAberto(false)}
        
        onConfirm={() => {
            setConfirmarSaidaAberto(false);
            onClose();
        }} title="Sair" message="Tem certeza que deseja sair? As alterações não serão salvas." />

    </div>
    );
};

export default ModalNovaVenda;