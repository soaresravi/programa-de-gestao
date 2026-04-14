import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './ModalProduto.module.scss';

const ModalMateriaPrima = ({ isOpen, onClose, onSave, initialData, title, buttonText, isEditing, onError }) => {

  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnitario, setValorUnitario] = useState(0);

  useEffect(() => {
      
    if (initialData) {
    
      setNome(initialData.nome || '');
      setQuantidade(initialData.quantidade || '');
      setValorUnitario(initialData.valorUnitarioNoMomento || '');
    
    } else {
    
      setNome('');
      setQuantidade(1);
      setValorUnitario(0);
    }

  }, [initialData, isOpen]);

  const valorTotal = quantidade * valorUnitario;

  const handleSubmit = () => {

    if (!nome || nome.trim() === '') {
      if (onError) onError('Por favor, informe o nome da matéria-prima');
      return;
    }
    
    if (!quantidade || quantidade <= 0) {
      if (onError) onError('Por favor, informe a quantidade');
      return;
    }
    
    if (!valorUnitario || valorUnitario <= 0) {
      if (onError) onError('Por favor, informe o valor unitário');
      return;
    }

    onSave({ nome, quantidade, valorUnitarioNoMomento: valorUnitario });
        
    setNome('');
    setQuantidade(1);
    setValorUnitario(0);
  
  };

  if (!isOpen) return null;

  return (
  
  <div className={`${styles.modalMateriaPrima} ${isEditing ? styles.modalMateriaPrimaEdit : ''}`} onClick={(e) => e.stopPropagation()}>

    <div className={styles.modalHeaderMateria}>      
      <h3 className={styles.modalTitleMateria}>{title || 'Informações da matéria-prima'}</h3>
      <button className={styles.closeButtonMateria} onClick={onClose}> <X size={20} /> </button>
    </div>
          
    <div className={styles.dividerMateria} />
    <div className={styles.formRowMateria}>

      <div className={styles.inputGroupMateria}>
        <label className={styles.labelMateria}>Nome:</label>
        <input type="text" className={styles.inputMateria} style={{ marginLeft: "-25px"}} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Madeira" />
      </div>
  
      <div className={styles.inputGroupMateria}>
        <label className={styles.labelMateria}>Quantidade:</label>
        <input type="number" className={styles.inputMateriaSmall} value={quantidade} onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)} min={1} />
      </div>

    </div>
    
    <div className={styles.formRowMateria}>
      
      <div className={styles.inputGroupMateria}>
        <label className={styles.labelMateria}>Valor unitário:</label>
        <input type="number" step="0.01" className={styles.inputMateriaSmall} style={{ marginRight: "65px"}} value={valorUnitario} onChange={(e) => setValorUnitario(parseFloat(e.target.value) || 0)} min={0} />
      </div>
      
      <div className={styles.inputGroupMateria}>
        <label className={styles.labelMateria} style={{ marginLeft: "-10px"}}>Valor total:</label>
        <span className={styles.valorTotalDisplay}> R$ {valorTotal.toFixed(2)} </span>
      </div>

    </div>
  
    <div className={styles.buttonGroupMateria}>
      <button className={styles.buttonMateria} onClick={handleSubmit}> {buttonText || 'Adicionar matéria-prima'} </button>
    </div>
    
  </div>
  );
};

export default ModalMateriaPrima;