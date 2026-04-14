import React, { useState } from 'react';
import { Trash, ChevronLeft } from 'lucide-react';

import ModalMateriaPrima from './ModalMateriaPrima';
import ConfirmacaoModal from './ConfirmacaoModal';
import styles from './ModalProduto.module.scss';

const EtapaMateriasPrimas = ({ formData, setFormData, avancar, voltar, onError }) => {
  
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [confirmacaoAberto, setConfirmacaoAberto] = useState(false);
  const [materiaParaRemover, setMateriaParaRemover] = useState(null);
  const [materiaEditando, setMateriaEditando] = useState(null);
  const [indiceEditando, setIndiceEditando] = useState(null);

  const custoTotal = formData.materiasPrimas.reduce( (total, mp) => total + (mp.quantidade * mp.valorUnitarioNoMomento), 0);

  const handleAvancar = () => {
    
    if (!formData.precoVenda || formData.precoVenda <= 0) {
      if (onError) onError('Por favor, informe o valor de venda do produto antes de continuar');
      return;
    }

    avancar();

  }

  const handleEditMateriaPrima = (index, materiaAtualizada) => {

    const novasMaterias = [...formData.materiasPrimas];
    novasMaterias[index] = materiaAtualizada;
    setFormData({ ...formData, materiasPrimas: novasMaterias });

    setModalEditarAberto(false);
    setMateriaEditando(null);
    setIndiceEditando(null);

  };

  const handleDeleteMateria = () => {
    
    const novasMaterias = formData.materiasPrimas.filter((_, i) => i !== materiaParaRemover);
    
    setFormData({ ...formData, materiasPrimas: novasMaterias });
    setConfirmacaoAberto(false);
    setMateriaParaRemover(null);

  };

  const abrirEditar = (index, materia) => {
    setIndiceEditando(index);
    setMateriaEditando(materia);
    setModalEditarAberto(true);
  };

  return (
  
  <div>
    
    <h3 className={styles.sectionTitle} style={{ marginBottom: "15px" }}> Custo de produção do produto: </h3>
  
    <div className={styles.materiasList}>
      
      {formData.materiasPrimas.map((mp, index) => (
        
        <div key={index} className={styles.materiaPrimaCard}>

          <div className={styles.cardContent}>
            <p><strong>{mp.nome} - Qtd.: {mp.quantidade} | Total: R$ {(mp.quantidade * mp.valorUnitarioNoMomento).toFixed(2)}</strong></p>
          </div>

          <div className={styles.cardActions}>
            
            <button style={{ fontFamily: 'Poppins', fontWeight: '700', color: '#02323C'}} onClick={() => abrirEditar(index, mp)}>Editar</button>
            
            <button className={styles.deleteBtn}
           
            onClick={() => {
              setMateriaParaRemover(index);
              setConfirmacaoAberto(true);
            }}>
              <Trash size={20} strokeWidth={2.5} />
            
            </button>

          </div>
        </div>
      ))}
    </div>
    
    <div className={styles.totalInfoLeft}>
      <p>Total de itens: {formData.materiasPrimas.length} </p>
      <p> <span className={styles.custoTotalText}>Custo TOTAL de fabricação: </span>
      <span className={styles.custoTotalValue}>R$ {custoTotal.toFixed(2)}</span> </p>
    </div>

    <div className={styles.divider} style={{margin: "16px 5px"}} />
  
    <h3 className={styles.sectionTitle}>Lucro bruto do produto:</h3>
      
    <div className={styles.lucroRow}>
      
      <div className={styles.lucroItem}>
        <label className={styles.lucroLabel}>Valor da venda:</label>
        <input type="number" step="0.01" className={styles.lucroInput} value={formData.precoVenda} onChange={(e) => setFormData({ ...formData, precoVenda: parseFloat(e.target.value) })} placeholder="0,00" />
      </div>
      
      <div className={styles.lucroItem} style={{ marginLeft: "-30px"}}>
        <span className={styles.lucroLabel}>Lucro:</span>
        <span className={styles.lucroDisplay}> R$ {(formData.precoVenda - custoTotal).toFixed(2)} </span>
      </div>

    </div>
  
    <div className={styles.buttonRow}>
      <button className={styles.buttonOutline} onClick={voltar}> <ChevronLeft size={25} /> Voltar </button>
      <button className={styles.button} onClick={handleAvancar}> Avançar </button>
    </div>

    <ModalMateriaPrima isOpen={modalEditarAberto} isEditing={true}
   
    onClose={() => {
      setModalEditarAberto(false);
      setMateriaEditando(null);
      setIndiceEditando(null);
    }} onSave={(materia) => handleEditMateriaPrima(indiceEditando, materia)} initialData={materiaEditando} title="Editar matéria-prima" buttonText="Salvar alterações" />

    <ConfirmacaoModal isOpen={confirmacaoAberto} onClose={() => setConfirmacaoAberto(false)} onConfirm={handleDeleteMateria} title="Excluir matéria-prima" message="Tem certeza que deseja excluir esta matéria-prima?" />
  
  </div>
  );
};

export default EtapaMateriasPrimas;