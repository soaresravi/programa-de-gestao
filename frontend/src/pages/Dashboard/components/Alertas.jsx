import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import styles from './Alertas.module.scss';

const Alertas = ({ alertas, addToast }) => {

  const [dismissed, setDismissed] = useState(false);

  const vencendoHoje = alertas?.vencendoHoje || [];
  const vencendoAmanha = alertas?.vencendoAmanha || [];

  const totalAlertas = vencendoHoje.length + vencendoAmanha.length;

  useEffect(() => {

    if (totalAlertas > 0 && !dismissed) {
      const msg = `ATENÇÃO! Você possui ${totalAlertas} conta(s) à vencer hoje ou amanhã! Pague AGORA`;
      addToast(msg, 'warning', 8000);
    }

  }, [alertas, totalAlertas, dismissed]);

  if (totalAlertas === 0 || dismissed) return null;

  return (
  
  <div className={styles.alertasContainer}>
    
    <div className={styles.alertasHeader}>
      <AlertTriangle size={20} strokeWidth={2.5} />
      <span>Contas a vencer</span>
      <button className={styles.closeBtn} onClick={() => setDismissed(true)}> <X size={16} /> </button>
    </div>
    
    <div className={styles.alertasList}>
      
      {vencendoHoje.length > 0 && (
        
        <div className={styles.alertaHoje}>
          <strong>Vencem HOJE:</strong> {vencendoHoje.map(d => d.nome).join(', ')}
        </div>
      
      )}
      
      {vencendoAmanha.length > 0 && (
        
        <div className={styles.alertaAmanha}>
          <strong>Vencem AMANHÃ:</strong> {vencendoAmanha.map(d => d.nome).join(', ')}
        </div>

      )}
    
    </div>
    
  </div>
  );
};

export default Alertas;