import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

import api from '../../../services/api';
import ConfirmacaoModal from './ModalProduto/ConfirmacaoModal';
import styles from './ModalMateriaPrimaProduto.module.scss';

const ModalMateriaPrimaProduto = ({ isOpen, onClose, onSave, onSuccess, onError }) => {

  const [nome, setNome] = useState('');
  const [custoRevenda, setCustoRevenda] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmarSaidaAberto, setConfirmarSaidaAberto] = useState(false);

  const lucroUnitario = (parseFloat(precoVenda) || 0) - (parseFloat(custoRevenda) || 0);
  const percentualLucro = parseFloat(custoRevenda) > 0 ? (lucroUnitario / parseFloat(custoRevenda)) * 100 : 0;

  useEffect(() => {

    if (isOpen) {
      setNome('');
      setCustoRevenda('');
      setPrecoVenda('');
      setLoading(false);
      setConfirmarSaidaAberto(false);
    }
    
  }, [isOpen]);

  const handleSubmit = async () => {

    if (!nome || nome.trim() === '') {
      if (onError) onError('Por favor, informe o nome da matéria-prima');
      return;
    }
    
    if (!custoRevenda || custoRevenda <= 0) {
      if (onError) onError('Por favor, informe o valor de custo');
      return;
    }
    
    if (!precoVenda || precoVenda <= 0) {
      if (onError) onError('Por favor, informe o preço de venda');
      return;
    }

    setLoading(true);

    try {

      const dadosParaEnviar = {
        nome: nome,
        tipo: 'MATERIA_PRIMA',
        precoVenda: parseFloat(precoVenda),
        custoProducao: parseFloat(custoRevenda),
        materiasPrimas: []
      };

      await api.post('/produtos', dadosParaEnviar);

      onSave();
      onClose();

      if (onSuccess) onSuccess();

      setNome('');
      setCustoRevenda('');
      setPrecoVenda('');

    } catch (error) {
      console.error('Erro ao salvar matéria-prima:', error);
      if (onError) onError(error.response?.data?.message || 'Erro ao salvar matéria-prima');
    } finally {
      setLoading(false);
    }

  };

  const handleClose = () => {

    if (nome || custoRevenda || precoVenda) {
      setConfirmarSaidaAberto(true);
    } else {
      onClose();
    }

  };

  const confirmarSaida = () => {
    setConfirmarSaidaAberto(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
  
  <div className={styles.overlay} onClick={handleClose}>
    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

      <div className={styles.modalHeader}>
        <h3 className={styles.modalTitle}>Adicionar matéria-prima</h3>
        <button className={styles.closeButton} onClick={handleClose}> <X size={20} /> </button>
      </div>
      
      <div className={styles.divider} />

      <div className={styles.formGroup}>
        <label>Nome da matéria-prima</label>
        <input type="text" className={styles.inputNome} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Madeira, Tecido, Espuma..." />
      </div>

      <div className={styles.formRow} style={{ marginRight: '80px'}}>
        
        <div className={styles.formGroup}>
          <label>Custo por unidade (R$)</label>
          <input type="number" step="0.01" className={styles.inputPequeno} value={custoRevenda} onChange={(e) => setCustoRevenda(e.target.value)} placeholder="Ex: 2.00" />
        </div>

        <div className={styles.formGroup}>
          <label>Preço de venda (R$)</label>
          <input type="number" step="0.01" className={styles.inputPequeno} value={precoVenda} onChange={(e) => setPrecoVenda(e.target.value)} placeholder="Ex: 5.00" />
        </div>

      </div>
    
      <div className={styles.infoBox}>
        <p><strong>Lucro por unidade:</strong>
        <span style={{ color: '#307060', fontWeight: '700', marginLeft: '5px'}}> R$ {lucroUnitario.toFixed(2)} </span>
        <span style={{ color: '#02323C', fontWeight: '700', marginLeft: '100px'}}> {percentualLucro.toFixed(1)}% </span> </p>
      </div>
    
      <div className={styles.buttonGroup}>
        <button className={styles.button} onClick={handleSubmit} disabled={loading}> {loading ? 'Salvando...' : 'Adicionar matéria-prima'} </button>
      </div>

    </div>

    <ConfirmacaoModal isOpen={confirmarSaidaAberto} onClose={() => setConfirmarSaidaAberto(false)} onConfirm={confirmarSaida} title="Sair" message="Tem certeza que deseja sair? Os dados não serão salvos." />
  
  </div>
  );
};

export default ModalMateriaPrimaProduto;