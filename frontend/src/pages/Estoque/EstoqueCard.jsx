import React from 'react';
import styles from './EstoqueCard.module.scss';
import { Ellipsis } from 'lucide-react';

const EstoqueCard = ({ item, onClick }) => {
  
  return (
  
  <div className={styles.card}>
    
    <div className={styles.imageContainer}>
      <img src={item.produtoFoto || 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Item_sem_imagem.svg/1280px-Item_sem_imagem.svg.png'}  alt={item.produtoNome} />
      <button className={styles.menuButton} onClick={(e) => { e.stopPropagation(); onClick(); }}> <Ellipsis size={18} /> </button>
    </div>
          
    <div className={styles.info}>
      
      <h3 className={styles.nome}>{item.produtoNome}</h3>
      <p className={styles.valorUnitario}>Unitário: R$ {item.produtoPreco?.toFixed(2)}</p>
        
      <div className={styles.estoqueBadge}>
        <span className={styles.qtdLabel}>Em estoque:</span>
        <span className={styles.qtdValor}>{item.quantidade}</span>
      </div>

    </div>
    
  </div>
  );
};

export default EstoqueCard;