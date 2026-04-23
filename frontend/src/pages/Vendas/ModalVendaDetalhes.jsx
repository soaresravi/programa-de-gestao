import React, { useState, useEffect } from 'react';
import { X, Trash } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Select from 'react-select';

import api from '../../services/api';
import ModalAddProduto from './components/ModalAddProduto';
import ConfirmacaoModal from '../Produtos/components/ModalProduto/ConfirmacaoModal';
import styles from './ModalVendaDetalhes.module.scss';

const ModalVendaDetalhes = ({ isOpen, onClose, vendaId, addToast, onSuccess }) => {

    const [isEditing, setIsEditing] = useState(false);
    const [venda, setVenda] = useState(null);
    const [loading, setLoading] = useState(false);
    const [originalData, setOriginalData] = useState(null);
    const [confirmarSaidaAberto, setConfirmarSaidaAberto] = useState(false);

    const [confirmarExclusaoAberto, setConfirmarExclusaoAberto] = useState(false);
    const [confirmarExclusaoItemAberto, setConfirmarExclusaoItemAberto] = useState(false);
    const [itemParaExcluirIndex, setItemParaExcluirIndex] = useState(null);

    const [modalEditarItemAberto, setModalEditarItemAberto] = useState(false);
    const [modalAddProdutoAberto, setModalAddProdutoAberto] = useState(false);
    const [itemEditando, setItemEditando] = useState(null);
    const [indiceEditando, setIndiceEditando] = useState(null);

    const { data: vendaData, refetch } = useQuery({

        queryKey: ['venda', vendaId],

        queryFn: async () => {
            const response = await api.get(`/vendas/${vendaId}`);
            return response.data;
        },

        enabled: isOpen && !!vendaId

    });

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
        }

    });

    useEffect(() => {

        if (!venda || !venda.itens) return;

        const novoSubtotal = venda.itens?.reduce((acc, item) => acc + (item.quantidade * item.precoUnitario), 0) || 0;
        const novoValorComFrete = novoSubtotal + (venda.valorFrete || 0);
        const acrescimoParcelas = venda.formaPagamento === 'CREDITO' && venda.parcelas > 0 ? venda.parcelas * 10 : 0;
        const novoValorTotalComJuros = novoValorComFrete + acrescimoParcelas;
        const novoValorTotal = novoValorTotalComJuros - (venda.valorDesconto || 0);
        const novoLucroBruto = novoSubtotal - (venda.itens?.reduce((acc, item) => acc + (item.quantidade * (item.custoUnitario || 0)), 0) || 0);

        if (venda.subtotalProdutos !== novoSubtotal || venda.valorTotal !== novoValorTotal) {

            setVenda(prev => ({
            
                ...prev,
    
                subtotalProdutos: novoSubtotal,
                valorComFrete: novoValorComFrete,
                valorTotalComJuros: novoValorTotalComJuros,
                valorTotal: novoValorTotal,
                lucroBruto: novoLucroBruto
            
            }));

        }

    }, [venda?.itens, venda?.valorFrete, venda?.valorDesconto, venda?.parcelas, venda?.formaPagamento]);

    useEffect(() => {

        if (vendaData) {

            setVenda(vendaData);
            
            if (!originalData) {
                setOriginalData(vendaData);
            }

        }

    }, [vendaData]);

    const handleEdit = () => {
        setOriginalData({ ...venda });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setVenda({ ...originalData });
        setIsEditing(false);
    };

    const handleSave = async () => {

        setLoading(true);

        try {

            const dadosParaEnviar = {       
                
                data: venda.data,
                vendedor: venda.vendedor,
                lojistaId: venda.lojista?.id || null,
                cidadeId: venda.cidade?.id || null,
                origem: venda.origem,
                foiNaLoja: venda.origem === 'LOJA_FISICA',

                itens: venda.itens.map(item => ({
                    produtoId: item.produto?.id,
                    quantidade: item.quantidade,
                    precoUnitario: item.precoUnitario,
                    custoUnitario: item.custoUnitario,
                    modoManual: item.modoManual || false
                })),

                formaPagamento: venda.formaPagamento,
                parcelas: venda.parcelas,
                valorFrete: venda.valorFrete,
                valorDesconto: venda.valorDesconto,
                clienteFinal: venda.clienteFinal

            };

            await api.put(`/vendas/${vendaId}`, dadosParaEnviar);
            addToast('Venda atualizada com sucesso!', 'success');
           
            setIsEditing(false);
            refetch();
            if (onSuccess) onSuccess();

        } catch (error) {
            console.error('Erro ao salvar:', error);
            addToast(error.response?.data?.message || 'Erro ao salvar alterações', 'error');
        } finally {
            setLoading(false);
        }

    };

    const handleDelete = async () => {

        setLoading(true);

        try {

            await api.delete(`/vendas/${vendaId}`);
            addToast('Venda excluída com sucesso!', 'success');
            setConfirmarExclusaoAberto(false);
            onClose();
            if (onSuccess) onSuccess();

        } catch (error) {
            console.error('Erro ao excluir:', error);
            addToast(error.response?.data?.message || 'Erro ao excluir venda', 'error');
        } finally {
            setLoading(false);
        }

    };

    const handleExcluirItem = (index) => {
        const novosItens = venda.itens.filter((_, i) => i !== index);
        setVenda({ ...venda, itens: novosItens });
        setConfirmarExclusaoItemAberto(false);
        addToast('Produto removido!', 'success');
    };

    const handleAddProduto = (novoItem) => {

        const itemParaAdicionar = {
           
            id: Date.now(),
            produtoId: novoItem.produtoId,
            nome: novoItem.nome,
            quantidade: novoItem.quantidade,
            precoUnitario: novoItem.precoUnitario,
            custoUnitario: novoItem.custoUnitario,
            modoManual: novoItem.modoManual || false,
           
            produto: {
                id: novoItem.produtoId,
                nome: novoItem.nome
            }

        };
        
        setVenda({ ...venda, itens: [...(venda.itens || []), itemParaAdicionar] });
        setModalAddProdutoAberto(false);
        addToast('Produto adicionado!', 'success');
    };

    const handleEditarItem = (item, index) => {

        const itemFormatadoParaModal = {
            id: item.id,
            produtoId: item.produto?.id || item.produtoId,
            nome: item.produto?.nome || item.nome,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            custoUnitario: item.custoUnitario || item.produto?.custoProducao || 0
        };

        setIndiceEditando(index);
        setItemEditando(itemFormatadoParaModal);
        setModalEditarItemAberto(true);
    };

    const handleConfirmarEdicaoItem = (itemAtualizado) => {

        const itemCompleto = { ...itemAtualizado, produto: { id: itemAtualizado.produtoId, nome: itemAtualizado.nome }};

        const novosItens = [...venda.itens];
        novosItens[indiceEditando] = itemCompleto;
        
        setVenda({ ...venda, itens: novosItens });
        setModalEditarItemAberto(false);
        setItemEditando(null);
        setIndiceEditando(null);
        addToast('Produto atualizado!', 'success');

    };

    const handleClose = () => {

        if (isEditing) {
            setConfirmarSaidaAberto(true);
        } else {
            onClose();
        }

    };

    if (!isOpen || !venda) return null;

    const formatarData = (data) => {
        if (!data) return '-';
        const [ano, mes, dia] = data.split('-');
        return `${dia}/${mes}/${ano}`;
    };

    const primeiroProduto = venda.itens?.[0]?.produto?.nome || 'Produto';
    const cidadeNome = venda.cidade?.nome || '-';
    const vendaIdFormatado = `#${venda.id.toString().padStart(4, '0')}`;

    const cidadesOptions = cidades?.map(c => ({ value: c.id, label: c.nome })) || [];
    const cidadeSelecionada = venda?.cidade ? { value: venda.cidade.id, label: venda.cidade.nome } : null;

    return (
    
    <div className={styles.modalOverlay} onClick={handleClose}>
        <div className={styles.modalContainer}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    
                    <div className={styles.headerLeft}>
                        <h2 className={styles.modalTitle}>{primeiroProduto}</h2>
                        <p className={styles.modalSubtitle}> • {cidadeNome} • {vendaIdFormatado} </p>
                    </div>
                    
                    <div className={styles.headerRight}>
                        
                        <div className={styles.dataInfo}>
                            
                            <span className={styles.dataLabel}>Data:</span>
                            
                            {isEditing ? (
                                <input type="date" value={venda.data} onChange={(e) => setVenda({ ...venda, data: e.target.value })} className={styles.dataInput} />
                            ) : (
                                <span className={styles.dataValue}>{formatarData(venda.data)}</span>
                            )}

                        </div>
                        
                        <button className={styles.modalClose} onClick={handleClose}> <X size={24} /> </button>
                    
                    </div>
                </div>
                
                <div className={styles.divider} />
                <div className={styles.modalContent}>
                    
                    <div className={styles.sectionHeader}>
                        
                        <h3 className={styles.sectionTitle}>Informações da venda</h3>
                        
                        {isEditing && (
                            <button className={styles.addProdutoBtn} onClick={() => setModalAddProdutoAberto(true)}> + Adicionar produto
                            </button>
                        )}

                    </div>
                    
                    <div className={styles.listaProdutos}>
                        
                        {venda.itens?.map((item, index) => (
                            
                            <div key={index} className={styles.produtoItem}>
                                <div className={styles.produtoInfo}>
                                    
                                    <span className={styles.produtoNome}> {item.nome || item.produto?.nome} - Qtd.: {item.quantidade} - R$ {item.precoUnitario?.toFixed(2)} </span>
                                    
                                    <div className={styles.produtoDetalhes}>
                                        
                                        {item.quantidade > 1 && (
                                            <span className={styles.produtoValor}>(Total: R$ {(item.quantidade * item.precoUnitario).toFixed(2)})</span>
                                        )}

                                    </div>

                                </div>
                                
                                {isEditing && (
                                
                                    <div className={styles.produtoAcoes}>
                                        
                                        <button className={styles.editarItemBtn} onClick={() => handleEditarItem(item, index)}>Editar</button>
                                        
                                        <button className={styles.excluirItemBtn} onClick={() => {
                                            setItemParaExcluirIndex(index);
                                            setConfirmarExclusaoItemAberto(true);
                                        }}> <Trash size={20} strokeWidth={2.5} /> </button>
                                    
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    {indiceEditando !== null && (
                    
                        <div>
                            <ModalAddProduto isEditing={true} initialData={itemEditando}
                            onClose={() => {
                                setIndiceEditando(null);
                                setItemEditando(null);
                            }} onAdd={handleConfirmarEdicaoItem} addToast={addToast} isLojista={venda?.clienteFinal === false} />
                       
                        </div>

                    )}

                    <div className={styles.dividerLight} />
                    <h3 className={styles.sectionTitle} style={{ marginBottom: '10px'}}>Informações de pagamento</h3>
                    <div className={styles.formRow}>
                        
                        {isEditing && (
                            
                            <div className={styles.formGroupCidade}>
                                
                                <label>Cidade:</label>
                                
                                <Select options={cidadesOptions} placeholder="Selecione..." value={cidadeSelecionada} onChange={(option) => {
                                    
                                    if (option) {
                                        
                                        const cidade = cidades?.find(c => c.id === option.value);
                                        
                                        setVenda({
                                            ...venda,
                                            cidadeId: option.value,
                                            cidade: cidade,
                                            valorFrete: cidade?.valorFrete || 0
                                        });
                                    }

                                }} styles={{ control: (base) => ({ ...base, backgroundColor: '#F0F8F0', border: 'none', borderRadius: '8px', minHeight: '30px', height: '30px', }), valueContainer: (base) => ({ ...base, padding: '0 10px', }), indicatorsContainer: (base) => ({ ...base, height: '28px', }), }} />
                            
                            </div>
                        )}
                        
                        <div className={styles.formGroupFrete}>
                            <label>Frete: <span className={styles.freteValor}>R$ {venda.valorFrete?.toFixed(2) || '0,00'}</span> </label>
                        </div>
                        
                        <div className={styles.formGroupDesconto}>
                            <label>Desconto:</label>
                            <input type="number" step="0.01" value={venda.valorDesconto || 0} disabled={!isEditing} className={!isEditing ? styles.inputDisabled : ''} onChange={(e) => setVenda({ ...venda, valorDesconto: parseFloat(e.target.value) || 0 })} />
                        </div>
                        
                    </div>
                    
                    <div className={styles.formRow}>
                        
                        <div className={styles.formGroupPagamento}>
                            
                            <label>Forma de pagamento:</label>
                            
                            <select value={venda.formaPagamento || ''} disabled={!isEditing} className={!isEditing ? styles.inputDisabled : ''} onChange={(e) => setVenda({ ...venda, formaPagamento: e.target.value })}>
                                <option value="PIX">Pix</option>
                                <option value="DINHEIRO">Dinheiro</option>
                                <option value="DEBITO">Débito</option>
                                <option value="CREDITO">Crédito</option>
                            </select>

                        </div>
                        
                        {venda.formaPagamento === 'CREDITO' && (
                        
                            <div className={styles.formGroupParcelas}>
                                <label>Parcelas:</label>
                                <select value={venda.parcelas || 1} disabled={!isEditing} className={!isEditing ? styles.inputDisabled : ''} onChange={(e) => setVenda({ ...venda, parcelas: parseInt(e.target.value) })}> {[1,2,3,4,5,6,7,8,9,10,11,12].map(p => ( <option key={p} value={p}>{p}x</option> ))} </select>
                            </div>

                        )}
                        
                        <div className={styles.formGroupTotal}>
                            <label>Total: <span className={styles.freteValor}>R$ {venda.valorTotal?.toFixed(2) || '0,00'}</span></label>
                        </div>

                    </div>

                    <div className={styles.dividerLight} />
                    <h3 className={styles.sectionTitle} style={{ marginBottom: '10px'}}>Informações complementares</h3>
                    <div className={styles.formRow}>
                        
                        <div className={styles.formGroupVendedor}>
                            <label>Vendedor:</label>
                            <input type="text" value={venda.vendedor || ''} disabled={!isEditing} className={!isEditing ? styles.inputDisabled : ''} onChange={(e) => setVenda({ ...venda, vendedor: e.target.value })} />
                        </div>
                        
                        <div className={styles.formGroupComprador}>
        
                            <label>Comprador:</label>
                            
                            {isEditing ? (
                            
                                <div className={styles.pillContainer}>
                                    <button className={`${styles.pill} ${venda.clienteFinal === true ? styles.active : ''}`} onClick={() => setVenda({ ...venda, clienteFinal: true, lojista: null })}> Cliente </button>
                                    <button className={`${styles.pill} ${venda.clienteFinal === false ? styles.active : ''}`} onClick={() => setVenda({ ...venda, clienteFinal: false })}> Lojista </button>
                                </div>
                            
                            ) : (
                                <input type="text" value={venda.clienteFinal ? 'Cliente' : 'Lojista'} disabled className={styles.inputDisabled} />
                            )}

                        </div>
                        
                        {!venda.clienteFinal && (
                            
                            <div className={styles.formGroupLojista}>
                                
                                <label>Lojista:</label>
                                
                                {isEditing ? (
                                    
                                    <select value={venda.lojista?.id || ''} onChange={(e) => {
                                        const lojista = lojistas?.find(l => l.id === parseInt(e.target.value));
                                        setVenda({ ...venda, lojista });
                                    }}>
                                        
                                        <option value="">Selecione</option>
                                        
                                        {lojistas?.map(l => (
                                            <option key={l.id} value={l.id}>{l.nome}</option>
                                        ))}
                                    
                                    </select>

                                ) : (
                                    <input type="text" value={venda.lojista?.nome || 'Nenhum'} disabled className={styles.inputDisabled} />
                                )}

                            </div>
                        )}
                    </div>
                    
                    <div className={styles.formRow}>
                       
                        <div className={styles.formGroupCusto}>
                            <label>Custo total:</label>
                            <span className={styles.valorVermelho}> R$ {venda.itens?.reduce((acc, i) => acc + (i.quantidade * (i.custoUnitario || 0)), 0).toFixed(2) || '0,00'} </span>
                        </div>
                        
                        <div className={styles.formGroupLucro}>
                            <label>Lucro total:</label>
                            <span className={styles.valorVerde}> R$ {venda.lucroBruto?.toFixed(2) || '0,00'} </span>
                        </div>

                    </div>
                   
                    <div className={styles.buttonRow}>
                        <button className={styles.editButton} onClick={isEditing ? handleCancel : handleEdit}> {isEditing ? 'Cancelar edição' : 'Editar informações da venda'} </button>
                        <button className={isEditing ? styles.saveButton : styles.deleteButton} onClick={isEditing ? handleSave : () => setConfirmarExclusaoAberto(true)} disabled={loading}> {loading ? 'Carregando...' : (isEditing ? 'Salvar alterações' : 'Excluir venda')} </button>
                    </div>

                </div>
            </div>

            {modalAddProdutoAberto && (
            
                <div className={styles.modalLado}>
                    <ModalAddProduto onClose={() => setModalAddProdutoAberto(false)} onAdd={handleAddProduto} addToast={addToast} isLojista={venda?.clienteFinal === false} />
                </div>

            )}
        
        </div>

        <ConfirmacaoModal isOpen={confirmarExclusaoAberto} onClose={() => setConfirmarExclusaoAberto(false)} onConfirm={handleDelete} title="Excluir venda" message="Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita." />
        
        <ConfirmacaoModal isOpen={confirmarSaidaAberto} onClose={() => setConfirmarSaidaAberto(false)}
       
       onConfirm={() => {
            setConfirmarSaidaAberto(false);
            setIsEditing(false);
            setVenda({ ...originalData });
            onClose();
        }} title="Sair" message="Tem certeza que deseja sair? As alterações não serão salvas." />
        
        <ConfirmacaoModal isOpen={confirmarExclusaoItemAberto} onClose={() => setConfirmarExclusaoItemAberto(false)} onConfirm={() => handleExcluirItem(itemParaExcluirIndex)} title="Excluir produto" message="Tem certeza que deseja remover este produto da venda?" />
    
    </div>
    );
};

export default ModalVendaDetalhes;