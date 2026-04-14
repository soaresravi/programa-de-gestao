import React, { useState } from 'react';
import { X, Trash } from 'lucide-react';

import ModalAddMateriaPrima from './ModalAddMateriaPrima';
import ConfirmacaoModal from '../ModalProduto/ConfirmacaoModal';
import styles from './ModalProdutoDetalhes.module.scss';

const ModalMateriasPrimas = ({ materiasPrimas, onUpdate, onClose, showSuccess, showError }) => {

  const [modalAddAberto, setModalAddAberto] = useState(false);
  const [confirmarExclusaoAberto, setConfirmarExclusaoAberto] = useState(false);
  const [materiaParaRemover, setMateriaParaRemover] = useState(null);
  const [materiaEditando, setMateriaEditando] = useState(null);

  const handleAddMateria = (novaMateria) => {
    const novasMaterias = [...materiasPrimas, novaMateria];
    onUpdate(novasMaterias);
    if (showSuccess) showSuccess('Matéria-prima adicionada com sucesso!');
  };

  const handleEditMateria = (index, materiaAtualizada) => {
    const novasMaterias = [...materiasPrimas];
    novasMaterias[index] = materiaAtualizada;
    onUpdate(novasMaterias);
    setMateriaEditando(null);
    if (showSuccess) showSuccess('Matéria-prima atualizada com sucesso!');
  };

  const abrirEditar = (index, materia) => {
    setMateriaEditando({ index, data: materia });
    setModalAddAberto(true); 
  };

  const handleDeleteMateria = () => {
    
    if (materiaParaRemover !== null) {
      
      const novasMaterias = materiasPrimas.filter((_, index) => index !== materiaParaRemover);
          
      onUpdate(novasMaterias);
      setConfirmarExclusaoAberto(false);
      setMateriaParaRemover(null);
          
      if (showSuccess) showSuccess('Matéria-prima removida com sucesso!');

    }

  };

  return (
  
  <>

    <div className={styles.modalMaterias} onClick={(e) => e.stopPropagation()}>
      
      <div className={styles.modalHeader} style={{ marginTop: "-35px"}}>
        <h3 className={styles.modalTitleMateria} style={{ marginLeft: "-20px"}}>Informações das matérias-primas</h3>
        <button className={styles.closeButton} style={{ marginRight: "-30px"}} onClick={onClose}> <X size={20} /> </button>
      </div>
      
      <div className={styles.divider} style={{ marginTop: "5px"}} />
    
      <div className={styles.materiasList}>
        
        {materiasPrimas.map((mp, index) => (
          
          <div key={index} className={styles.materiaPrimaCard}>
           
            <div className={styles.cardContent}>
              <p style={{ fontSize: "16px"}}><strong>{mp.nome} - Qtd.: {mp.quantidade} | Total: R$ {(mp.quantidade * mp.valorUnitarioNoMomento).toFixed(2)} </strong> </p>
            </div>
            
            <div className={styles.cardActions}>
              
              <button style={{ fontWeight: '700', color: '#02323C', fontFamily: 'Poppins', fontSize: '16px'}} onClick={() => abrirEditar(index, mp)}> Editar </button>
              
              <button className={styles.deleteBtn}
              
              onClick={() => {
                setMateriaParaRemover(index);
                setConfirmarExclusaoAberto(true);
              }}> <Trash size={20} strokeWidth={2.5} />
              
              </button>

            </div>
          </div>
        ))}
      </div>
      
      <button className={styles.addMateriaBtn} onClick={() => setModalAddAberto(true)}> Adicionar matéria-prima </button>

    </div>
    
    {modalAddAberto && (
    
      <ModalAddMateriaPrima isOpen={modalAddAberto}
      
      onClose={() => {
        setModalAddAberto(false);
        setMateriaEditando(null);
      }} onSave={handleAddMateria} initialData={materiaEditando?.data} isEditing={!!materiaEditando} onEditSave={(materia) => handleEditMateria(materiaEditando?.index, materia)} showSuccess={showSuccess} showError={showError} />
    
    )}
    
    <ConfirmacaoModal isOpen={confirmarExclusaoAberto} onClose={() => setConfirmarExclusaoAberto(false)} onConfirm={handleDeleteMateria} title="Excluir matéria-prima" message="Tem certeza que deseja excluir esta matéria-prima?" />
  
  </>
  );
};

export default ModalMateriasPrimas;