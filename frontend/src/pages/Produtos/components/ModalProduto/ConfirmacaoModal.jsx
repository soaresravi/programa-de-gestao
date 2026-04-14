import React from 'react';
import styles from './ModalProduto.module.scss';

const ConfirmacaoModal = ({ isOpen, onClose, onConfirm, title, message }) => {

  if (!isOpen) return null;

  return (
  
  <div className={styles.overlay} onClick={onClose}>
    
    <div className={styles.modal} style={{ maxWidth: '370px' }} onClick={(e) => e.stopPropagation()}>
     
      <h3 className={styles.modalTitle} style={{ textAlign: 'center', marginTop: "20px" }}>{title}</h3>
      <div className={styles.divider} />
      <p style={{ textAlign: 'center', marginBottom: '10px', padding: "10px"}}>{message}</p>

      <div className={styles.buttonGroup} style={{ justifyContent: 'center', gap: '16px', marginBottom: "30px" }}>
        <button className={styles.button} onClick={onClose}>Cancelar</button>
        <button className={styles.buttonDanger} onClick={onConfirm}>Confirmar</button>
      </div>

    </div>
  </div>
  );
};

export default ConfirmacaoModal;