import React from 'react';
import styles from './GraficoBarraHorizontal.module.scss';

const GraficoBarraHorizontal = ({ data }) => {

  const total = (data?.lojaFisica || 0) + (data?.outros || 0);
  const lojaFisicaPercent = total > 0 ? ((data?.lojaFisica || 0) / total) * 100 : 0;
  const outrosPercent = total > 0 ? ((data?.outros || 0) / total) * 100 : 0;
  
  const items = [
    { nome: 'Vendas com a loja', valor: data?.lojaFisica || 0, percent: lojaFisicaPercent, color: '#10b981' },
    { nome: 'Vendas sem a loja', valor: data?.outros || 0, percent: outrosPercent, color: '#ec489a' }
  ];

  return (
  <div className={styles.container}>
    
    {items.map((item, index) => (
      
      <div key={index} className={styles.item}>
        
        <div className={styles.labelRow}>
          <span className={styles.name}>{item.nome}</span>
          <span className={styles.percent}> {item.percent.toFixed(1)}% (R$ {item.valor.toFixed(2)}) </span>
        </div>
        
        <div className={styles.barBackground}>
          <div className={styles.barFill} style={{ width: `${Math.min(item.percent, 100)}%`, backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }} />
        </div>

      </div>

    ))
    }
  </div>
  );
};

export default GraficoBarraHorizontal;