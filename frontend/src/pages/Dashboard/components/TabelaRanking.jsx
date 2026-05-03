import React, { useState, useEffect } from 'react';
import styles from './TabelaRanking.module.scss';

const TabelaRanking = ({ data, columns }) => {

  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  useEffect(() => {
    setPaginaAtual(1);
  }, [data]);

  if (!data || data.length === 0) {
    return <div className={styles.empty}> Nenhum dado disponível</div>;
  }

  const totalPaginas = Math.ceil(data.length / itensPorPagina);
  const indiceUltimoItem = paginaAtual * itensPorPagina;
  const indicePrimeiroItem = indiceUltimoItem - itensPorPagina;
  const dadosPaginados = data.slice(indicePrimeiroItem, indiceUltimoItem);

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

    {totalPaginas > 1 && (
      
      <div className={styles.paginacao}>
        <button className={styles.paginacaoBtn} disabled={paginaAtual === 1} onClick={() => setPaginaAtual(paginaAtual - 1)}> ← Anterior </button>
        <span className={styles.paginacaoInfo}> Página <strong>{paginaAtual}</strong> de <strong>{totalPaginas}</strong> </span>
        <button className={styles.paginacaoBtn} disabled={paginaAtual === totalPaginas} onClick={() => setPaginaAtual(paginaAtual + 1)}> Próxima → </button>
      </div>
      
    )}

  </div>
  );
};

export default TabelaRanking;