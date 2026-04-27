import React, { useState } from 'react';
import { X } from 'lucide-react';

import api from '../../../services/api';
import styles from './ModalNovaDespesa.module.scss';
import ConfirmacaoModal from '../../Produtos/components/ModalProduto/ConfirmacaoModal';

const ModalNovaDespesa = ({ isOpen, onClose, onSuccess, addToast, tipo }) => {

  const [confirmarSaidaAberto, setConfirmarSaidaAberto] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    valor: '',
    dataVencimento: '',
    dataPagamento: '',
    status: 'PENDENTE',
    fornecedor: false
  });

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!formData.nome) {
      addToast('Por favor, informe o nome da despesa', 'error');
      return;
    }
    
    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      addToast('Por favor, informe um valor válido', 'error');
      return;
    }

    setLoading(true);

    try {

      await api.post('/despesas', { ...formData, tipo, valor: parseFloat(formData.valor), dataVencimento: formData.dataVencimento || null, dataPagamento: formData.dataPagamento || null });
      addToast('Despesa adicionada com sucesso!', 'success');
      onSuccess();
      onClose();

    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      addToast(error.response?.data?.message || 'Erro ao salvar despesa', 'error');
    } finally {
      setLoading(false);
    }

  };

  const handleClose = () => {
    setConfirmarSaidaAberto(true);
  };

  return (
    
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Nova despesa</h2>
          <button className={styles.modalClose} onClick={handleClose}> <X size={24} /> </button>
        </div>
        
        <div className={styles.divider} />
    
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          
          <div className={styles.formGroup}>
            <label>Nome da despesa</label>
            <input type="text" placeholder="Ex: Aluguel, Luz, Fornecedor..." value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} autoFocus />
          </div>
    
          <div className={styles.formRow}>
            
            <div className={styles.formGroup}>
              <label>Valor (R$)</label>
              <input type="number" step="0.01" placeholder="0,00" value={formData.valor}onChange={(e) => setFormData({ ...formData, valor: e.target.value })} />
            </div>
            
            {tipo === 'LOJA' && (
              
              <div className={styles.formGroupCheckbox}>
                <label> <input type="checkbox" checked={formData.fornecedor} onChange={(e) => setFormData({ ...formData, fornecedor: e.target.checked })} /> É fornecedor </label>
              </div>

            )}

          </div>
    
          <div className={styles.formRow}>
            
            <div className={styles.formGroup}>
              <label>Data de vencimento</label>
              <input type="date" value={formData.dataVencimento} onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })} />
            </div>
            
            <div className={styles.formGroup}>
              <label>Data de pagamento</label>
              <input type="date" value={formData.dataPagamento} onChange={(e) => setFormData({ ...formData, dataPagamento: e.target.value })} />
            </div>

          </div>
    
          <div className={styles.formGroup}>
            
            <label>Status</label>
            
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
              <option value="PENDENTE">Pendente</option>
              <option value="PAGO">Pago</option>
              <option value="ATRASADO">Atrasado</option>
            </select>
          
          </div>
    
          <button type="submit" className={styles.salvarBtn} disabled={loading}> {loading ? 'Salvando...' : 'Adicionar despesa'} </button>
        
        </form>
      </div>

      <ConfirmacaoModal isOpen={confirmarSaidaAberto} onClose={() => setConfirmarSaidaAberto(false)}
          
      onConfirm={() => {
        setConfirmarSaidaAberto(false);
        onClose();
      }} title="Sair" message="Tem certeza que deseja sair? As alterações não serão salvas." />

    </div>
  );
};

export default ModalNovaDespesa;