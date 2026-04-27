import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

import api from '../../../services/api';
import ConfirmacaoModal from '../../Produtos/components/ModalProduto/ConfirmacaoModal';
import styles from './ModalDetalhesDespesa.module.scss';

const ModalDetalhesDespesa = ({ isOpen, onClose, despesaId, addToast, onSuccess }) => {

  const [isEditing, setIsEditing] = useState(false);
  const [despesa, setDespesa] = useState(null);
  const [loading, setLoading] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [confirmarExclusaoAberto, setConfirmarExclusaoAberto] = useState(false);
  const [confirmarSaidaAberto, setConfirmarSaidaAberto] = useState(false);

  useEffect(() => {

    if (isOpen && despesaId) {
      buscarDespesa();
    }

  }, [isOpen, despesaId]);

  const buscarDespesa = async () => {

    try {

      const response = await api.get(`/despesas/${despesaId}`);
      setDespesa(response.data);
      setOriginalData(response.data);

    } catch (error) {
      console.error('Erro ao buscar despesa:', error);
      addToast('Erro ao carregar dados', 'error');
    }

  };

  const handleEdit = () => {
    setOriginalData({ ...despesa });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDespesa({ ...originalData });
    setIsEditing(false);
  };

  const handleSave = async () => {

    if (!despesa.nome) {
      addToast('Por favor, informe o nome da despesa', 'error');
      return;
    }
        
    if (!despesa.valor || despesa.valor <= 0) {
      addToast('Por favor, informe um valor válido', 'error');
      return;
    }

    setLoading(true);

    try {

      await api.put(`/despesas/${despesaId}`, despesa);
      addToast('Despesa atualizada com sucesso!', 'success');
      setIsEditing(false);
      onSuccess();
            
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

      await api.delete(`/despesas/${despesaId}`);
      addToast('Despesa excluída com sucesso!', 'success');
      setConfirmarExclusaoAberto(false);
      onClose();
      onSuccess();

    } catch (error) {
      console.error('Erro ao excluir:', error);
      addToast(error.response?.data?.message || 'Erro ao excluir despesa', 'error');
    } finally {
      setLoading(false);
    }

  };

  const handleClose = () => {
        
    if (isEditing) {
      setConfirmarSaidaAberto(true);
    } else {
      onClose();
    }

  };

  if (!isOpen || !despesa) return null;

  const formatarData = (data) => {
    if (!data) return '-';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const getStatusClass = (status) => {

    const classes = {
      'PAGO': styles.statusPago,
      'PENDENTE': styles.statusPendente,
      'ATRASADO': styles.statusAtrasado
    };
    
    return classes[status] || '';

  };

  return (
  
  <div className={styles.modalOverlay} onClick={handleClose}>
    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
      
      <div className={styles.modalHeader}>
        <h2 className={styles.modalTitle}>Detalhes da despesa</h2>
        <button className={styles.modalClose} onClick={handleClose}> <X size={24} /> </button>
      </div>
      
      <div className={styles.divider} />
      <div className={styles.modalContent}>
        
        <div className={styles.formGroup}>
          <label>Nome</label>
          <input type="text" value={despesa.nome || ''} disabled={!isEditing} className={!isEditing ? styles.inputDisabled : ''} onChange={(e) => setDespesa({ ...despesa, nome: e.target.value })} />
        </div>
    
        <div className={styles.formRow}>
          
          <div className={styles.formGroup}>
            <label>Valor (R$)</label>
            <input type="number" step="0.01" value={despesa.valor || ''} disabled={!isEditing} className={!isEditing ? styles.inputDisabled : ''} onChange={(e) => setDespesa({ ...despesa, valor: parseFloat(e.target.value) })} />
          </div>
          
          {despesa.tipo === 'LOJA' && (
          
            <div className={isEditing ? styles.formGroupCheckbox : styles.formGroup}>
              
              {isEditing ? (   
                <label> <input type="checkbox" checked={despesa.fornecedor} onChange={(e) => setDespesa({ ...despesa, fornecedor: e.target.checked })} />  É fornecedor </label>
              ) : (
                <>
                  <label>Fornecedor</label>
                  <input type="text" value={despesa.fornecedor ? 'Sim' : 'Não'} disabled={true} className={styles.inputDisabled} />
                </>
              )}

            </div>

          )}

        </div>
    
        <div className={styles.formRow}>
          
          <div className={styles.formGroup}>
            <label>Data de vencimento</label>
            <input type="date" value={despesa.dataVencimento || ''} disabled={!isEditing} className={!isEditing ? styles.inputDisabled : ''} onChange={(e) => setDespesa({ ...despesa, dataVencimento: e.target.value })} />
          </div>
          
          <div className={styles.formGroup}>
            <label>Data de pagamento</label>
            <input type="date" value={despesa.dataPagamento || ''} disabled={!isEditing} className={!isEditing ? styles.inputDisabled : ''} onChange={(e) => setDespesa({ ...despesa, dataPagamento: e.target.value })} />
          </div>
          
        </div>
    
        <div className={styles.formGroup}>
          
          <label>Status</label>
          
          {isEditing ? (
            
            <select value={despesa.status || 'PENDENTE'} disabled={!isEditing} className={!isEditing ? styles.inputDisabled : ''} onChange={(e) => setDespesa({ ...despesa, status: e.target.value })}>
              <option value="PENDENTE">Pendente</option>
              <option value="PAGO">Pago</option>
              <option value="ATRASADO">Atrasado</option>
            </select>

          ) : (
            
            <div className={`${styles.infoValue} ${getStatusClass(despesa.status)}`}>
              {despesa.status === 'PAGO' ? 'Pago' : despesa.status === 'PENDENTE' ? 'Pendente' : 'Atrasado'}
            </div>

          )}

        </div>
    
        <div className={styles.buttonRow}>
          <button className={styles.editButton} onClick={isEditing ? handleCancel : handleEdit}> {isEditing ? 'Cancelar edição' : 'Editar despesa'} </button>
          <button className={isEditing ? styles.saveButton : styles.deleteButton} onClick={isEditing ? handleSave : () => setConfirmarExclusaoAberto(true)} disabled={loading}> {loading ? 'Carregando...' : (isEditing ? 'Salvar alterações' : 'Excluir despesa')} </button>
        </div>

      </div>
    </div>
    
    <ConfirmacaoModal isOpen={confirmarExclusaoAberto} onClose={() => setConfirmarExclusaoAberto(false)} onConfirm={handleDelete} title="Excluir despesa" message="Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita." />
    
    <ConfirmacaoModal isOpen={confirmarSaidaAberto} onClose={() => setConfirmarSaidaAberto(false)}
    
    onConfirm={() => {
      setConfirmarSaidaAberto(false);
      setIsEditing(false);
      setDespesa({ ...originalData });
      onClose();
    }} title="Sair" message="Tem certeza que deseja sair? As alterações não serão salvas." />

  </div>
  );
};

export default ModalDetalhesDespesa;