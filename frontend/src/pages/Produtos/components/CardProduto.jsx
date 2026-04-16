import React, { useState } from 'react';
import { Ellipsis } from 'lucide-react';

import styles from './CardProduto.module.scss';

const formatarTipo = (tipo) => {

  const tipos = {
    'CAMA_CONJUGADA': 'Cama',
    'BICAMA': 'Bicama',
    'BASE_BOX': 'Base',
    'BOX_BAU': 'Baú',
    'COLCHAO_MOLA': 'Colchão de mola',
    'COLCHAO_ESPUMA': 'Colchão de espuma',
    'MATERIA_PRIMA' : 'Matéria-prima'
  };

  return tipos[tipo] || tipo;

};

const CardProduto = ({ produto, onClick }) => {

  return (
  
  <div className={styles.card} onClick={onClick}>

    <div className={styles.imageContainer}>
      <img style={{ borderBottomLeftRadius: '15px'}} src={produto.fotoURL || 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Item_sem_imagem.svg/1280px-Item_sem_imagem.svg.png'} alt={produto.nome} />
      <button className={styles.menuButton} onClick={(e) => { e.stopPropagation(); onClick(); }}> <Ellipsis size={18} /> </button>
    </div>
        
    <div className={styles.info}>
      <h3 className={styles.nome}>{produto.nome}</h3>
      <p className={styles.preco}>R$ {produto.precoVenda?.toFixed(2)}</p>
      <span className={styles.tipo}>{formatarTipo(produto.tipo)}</span>
    </div>

  </div>
  );
  
};

export default CardProduto;