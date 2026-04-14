import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './ModalProdutoDetalhes.module.scss';

const ModalAddMateriaPrima = ({ isOpen, onClose, onSave, initialData, isEditing, onEditSave, showError }) => {
  
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnitario, setValorUnitario] = useState(0);

  useEffect(() => {
    
    if (isOpen) {
      
      if (initialData && isEditing) {
        setNome(initialData.nome || '');
        setQuantidade(initialData.quantidade || 1);
        setValorUnitario(initialData.valorUnitarioNoMomento || 0);
      } else {
        setNome('');
        setQuantidade(1);
        setValorUnitario(0);
      }

    }

  }, [isOpen, initialData, isEditing]);

  const valorTotal = quantidade * valorUnitario;

  const handleSubmit = () => {
    
    if (!nome || nome.trim() === '') {
      if (showError) showError('Por favor, informe o nome da matéria-prima');
      return;
    }

    if (!quantidade || quantidade <= 0) {
      if (showError) showError('Por favor, informe a quantidade');
      return;
    }
    
    if (!valorUnitario || valorUnitario <= 0) {
      if (showError) showError('Por favor, informe o valor unitário');
      return;
    }

    if (isEditing && onEditSave) {
      onEditSave({ nome, quantidade, valorUnitarioNoMomento: valorUnitario });
    } else {
      onSave({ nome, quantidade, valorUnitarioNoMomento: valorUnitario });
    }

    onClose();

  };

  const handleClose = () => {
    setNome('');
    setQuantidade(1);
    setValorUnitario(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
 
  <div className={styles.modalAddMateria}>

    <div className={styles.modalHeader} style={{ marginTop: "-35px"}}>
      <h3 className={styles.modalTitleMateria}>{isEditing ? 'Editar matéria-prima' : 'Adicionar matéria-prima'}</h3>
      <button className={styles.closeButton} style={{ marginRight: "-30px"}} onClick={handleClose}> <X size={20} /> </button>
    </div>
    
    <div className={styles.divider} style={{ marginTop: "5px"}} />
    
    <div className={styles.formRowHorizontal}>
      
      <div className={styles.inputGroupInline}>
        <label>Nome:</label>
        <input type="text" className={styles.inputNome} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Madeira" />
      </div>
      
      <div className={styles.inputGroupInline}>
        <label>Quantidade:</label>
        <input type="number" className={styles.inputPequeno} value={quantidade} onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)} min={1} />
      </div>

    </div>

    <div className={styles.formRowHorizontal}>
     
      <div className={styles.inputGroupInline}>
        <label>Valor unitário:</label>
        <input type="number" step="0.01" className={styles.inputPequeno} value={valorUnitario} onChange={(e) => setValorUnitario(parseFloat(e.target.value) || 0)} min={0} />
      </div>

      <div className={styles.inputGroupInline} style={{ marginLeft: "110px"}}>
        <label>Total:</label>
        <span className={styles.valorTotalLabel}> R$ {valorTotal.toFixed(2)} </span>
      </div>

    </div>

    <div className={styles.buttonGroup}>
      <button className={styles.button} onClick={handleSubmit}> {isEditing ? 'Salvar alterações' : 'Adicionar matéria-prima'} </button>
    </div>
    
  </div>
  );
};

export default ModalAddMateriaPrima;