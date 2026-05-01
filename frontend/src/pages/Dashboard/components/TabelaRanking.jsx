import React from 'react';
import styles from './TabelaRanking.module.scss';

const TabelaRanking = ({ data, columns }) => {

  if (!data || data.length === 0) {
    return <div className={styles.empty}> Nenhum dado disponível</div>;
  }

  return (
  
  <div className={styles.tableWrapper}>
    <table className={styles.table}>
      
      <thead>
        
        <tr> {columns.map(col => (
          <th key={col.key}>{col.label}</th>
        ))} </tr>
      
      </thead>
      
      <tbody>
        
        {data.map((item, idx) => (

          <tr key={idx}> {columns.map(col => (
            <td key={col.key}> {col.format ? col.format(item[col.key]) : item[col.key]} </td>
          ))} </tr>

        ))}
      
      </tbody>

    </table>
    
  </div>
  );
};

export default TabelaRanking;