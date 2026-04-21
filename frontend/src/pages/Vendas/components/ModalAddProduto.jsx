import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Select from 'react-select';

import api from '../../../services/api';
import styles from './ModalAddProduto.module.scss';

const ModalAddProduto = ({ onClose, onAdd, addToast, isLojista, isEditing, initialData }) => {

    const [selectedProduto, setSelectedProduto] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [quantidade, setQuantidade] = useState(1);
    const [precoManual, setPrecoManual] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    React.useEffect(() => {

        if (isEditing && initialData) {

            const produtoInicial = {
                id: initialData.produtoId,
                nome: initialData.nome,
                precoVenda: initialData.precoUnitario,
                custoProducao: initialData.custoUnitario
            };

            setSelectedProduto(produtoInicial);
            
            setSelectedOption({
                value: initialData.produtoId, 
                label: initialData.nome 
            });

            setQuantidade(initialData.quantidade);
            setPrecoManual(initialData.precoUnitario.toString());
            setSearchTerm(initialData.nome);

        }
    
    }, [isEditing, initialData]);

    const { data: produtos, isLoading } = useQuery({

        queryKey: ['produtos', searchTerm],

        queryFn: async () => {

            const response = await api.get('/produtos', {
                params: { search: searchTerm, page: 0, size: 20 }
            });

            return response.data;
        
        },

    });

    const options = produtos?.map(p => ({
      value: p.id,
      label: `${p.nome}`
    })) || [];

    const handleSelectProduto = (option) => {
        
        setSelectedOption(option);
        
        if (option) {
            
            const produto = produtos?.find(p => p.id === option.value);
            const produtoFinal = produto || selectedProduto;

            setSelectedProduto(produtoFinal);
            
            if (!isLojista && produtoFinal?.precoVenda) {
                setPrecoManual(produtoFinal.precoVenda.toString());
            }
        
        } else {
            setSelectedProduto(null);
            setPrecoManual('');
        }

    };

    const handleAdd = () => {

        if (!selectedProduto) {
            addToast('Selecione um produto', 'error');
            return;
        }

        if (!quantidade || quantidade <= 0) {
            addToast('Quantidade inválida', 'error');
            return;
        }

        if (isLojista && (!precoManual || parseFloat(precoManual) <= 0)) {
            addToast('Informe o valor unitário', 'error');
            return;
        }

        const custoUnitario = selectedProduto.custoProducao || 0;
        const precoUnitario = isLojista ? parseFloat(precoManual) : selectedProduto.precoVenda;
        const subtotal = quantidade * precoUnitario;
        const custoTotal = quantidade * custoUnitario;
        const lucro = subtotal - custoTotal;

        onAdd({
            produtoId: selectedProduto.id,
            nome: selectedProduto.nome,
            quantidade,
            precoUnitario,
            custoUnitario,
            subtotal,
            custoTotal,
            lucro,
            modoManual: isLojista,
            id: isEditing ? initialData?.id : Date.now()
        });

        onClose();

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
    
    <div className={`${styles.modal} ${isEditing ? styles.modalEditar : ''}`} onClick={(e) => e.stopPropagation()}>
        
        <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Informações do produto</h2>
            <button className={styles.modalClose} onClick={onClose}> <X size={24} /> </button>
        </div>

        <div className={styles.divider} />
       
        <div className={styles.formGroupProduto}>
            <label>Produto:</label>
            <Select value={selectedOption} options={options} placeholder="Buscar produto..." isClearable isLoading={isLoading} onInputChange={(inputValue) => setSearchTerm(inputValue)} onChange={handleSelectProduto} styles={customStyles} noOptionsMessage={() => isLoading ? 'Carregando...' : 'Nenhum produto encontrado'} />
        </div>

        <div className={styles.formRow}>
            
            <div className={styles.formGroupInline}>
                <label>Quantidade:</label>
                <input type="number" style={{ marginRight: '80px'}} min="1" className={styles.quantidadeInput} value={quantidade} onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)} />
            </div>
            
            {isLojista ? (
                
                <div className={styles.formGroupInline}>
                    <label>Valor unitário:</label>
                    <input type="number" step="0.01" placeholder="Ex:250,00" style={{ width: '90px', height: '30px', padding: '8px'}} value={precoManual} onChange={(e) => setPrecoManual(e.target.value)} />
                </div>
                
            ) : (
                
                selectedProduto && (
                    
                    <div className={styles.formGroupInline}>
                        <label>Valor unitário:</label>
                        <strong className={styles.valorVerde}>R$ {selectedProduto.precoVenda?.toFixed(2)}</strong>
                    </div>
                )
            )}
        </div>
        
        {selectedProduto && (
        
            <div className={styles.infoRow}>
                
                <div className={styles.infoItem}>
                    <span>Gasto:</span>
                    <strong className={styles.valorVermelho}> R$ {(selectedProduto.custoProducao || 0).toFixed(2)} </strong>
                </div>
                
                <div className={styles.infoItem}>
                    <span>Lucro:</span>
                    <strong className={styles.valorEscuro}> R$ {isLojista ? ((parseFloat(precoManual) || 0) - (selectedProduto.custoProducao || 0)).toFixed(2) : ((selectedProduto.precoVenda || 0) - (selectedProduto.custoProducao || 0)).toFixed(2)} </strong>
                </div>

            </div>
        )}

        <button className={styles.addBtn} onClick={handleAdd}> {isEditing ? 'Salvar alterações' : 'Adicionar produto'} </button>
    
    </div>
    );
};

export default ModalAddProduto;