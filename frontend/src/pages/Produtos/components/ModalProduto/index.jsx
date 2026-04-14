import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

import EtapaInformacoes from './EtapaInformacoes';
import EtapaMateriasPrimas from './EtapaMateriasPrimas';
import EtapaResumo from './EtapaResumo';
import ModalMateriaPrima from './ModalMateriaPrima';
import ConfirmacaoModal from './ConfirmacaoModal'; 
import styles from './ModalProduto.module.scss';

const ModalProduto = ({ isOpen, onClose, produto, onSave, showSuccess, showError }) => {

    const [etapa, setEtapa] = useState(1);
    const [modalMateriaAberto, setModalMateriaAberto] = useState(false);
    const [confirmarSaidaAberto, setConfirmarSaidaAberto] = useState(false);
    const [produtoSalvo, setProdutoSalvo] = useState(false);
    
    const handleAddMateria = (novaMateria) => {
        
        setFormData({
            ...formData,
            materiasPrimas: [...formData.materiasPrimas, novaMateria]
        });

    };

    const [formData, setFormData] = useState({
        nome: produto?.nome || '',
        tipo: produto?.tipo || '',
        modelo: produto?.modelo || '',
        comprimento: produto?.comprimento || '',
        largura: produto?.largura || '',
        altura: produto?.altura || '',
        espessura: produto?.espessura || '',
        acabamento: produto?.acabamento || '',
        especificacao: produto?.especificacao || '',
        precoVenda: produto?.precoVenda || '',
        fotoURL: produto?.fotoURL || '',
        materiasPrimas: produto?.materiasPrimas || [],
    });

    const avancar = () => {
        setModalMateriaAberto(false);
        setEtapa(etapa + 1);
    };
    
    const voltar = () => {
        setModalMateriaAberto(false); 
        setEtapa(etapa - 1);
    };

    const handleClose = () => {

        if (produtoSalvo) {
            setEtapa(1);
            setModalMateriaAberto(false);
            setProdutoSalvo(false);
            onClose();
        } else {
            setConfirmarSaidaAberto(true);
        }

    };

    const confirmarSaida = () => {
        setEtapa(1);
        setModalMateriaAberto(false);
        setConfirmarSaidaAberto(false);
        setProdutoSalvo(false);
        onClose();
    };
    
    React.useEffect(() => {
        
        if (isOpen) {
            
            if (produto) {
                setFormData({ ...produto });
            } else {

                setFormData({
                    nome: '', tipo: '', modelo: '', comprimento: '', largura: '',
                    altura: '', espessura: '', acabamento: '', especificacao: '',
                    precoVenda: '', fotoURL: '', materiasPrimas: [],
                });

            }
            
            setEtapa(1);

        }

  }, [isOpen, produto]);
  
  if (!isOpen) return null;
  
  return (
  
  <div className={styles.overlay} onClick={handleClose}>
    <div className={styles.modalsContainer} onClick={(e) => e.stopPropagation()}>
        <div className={`${styles.modal} ${etapa === 2 ? styles.modalMaterias : ''} ${etapa === 3 ? styles.modalResumo : ''}`}>
            
            <div className={styles.modalHeader}>
                
                <h2 className={styles.modalTitle} style={{ textAlign: etapa === 3 ? 'center' : 'left', flex: etapa === 3 ? 1 : 'none'}}> {etapa === 1 && "Adicionar produto"} {etapa === 2 && "Adicionar produto"} {etapa === 3 && "Resumo do produto"}</h2>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    
                    {etapa === 2 && (
                        <button className={styles.buttonOutline} onClick={() => setModalMateriaAberto(true)} style={{ padding: '6px 12px', marginLeft: "30px", fontSize: '14px', fontWeight: '700', background: '#02323C', border: 'none', color: '#fff'}}> + Adicionar matéria-prima </button>
                    )}
                    
                    <button className={styles.closeButton} onClick={handleClose}><X size={20} /></button>

                </div>

            </div>
            
            <div className={styles.divider} />
            <div className={styles.modalContent}>
                
                <AnimatePresence mode="wait">
                    
                    {etapa === 1 && (
                        <motion.div key="informacoes" initial={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} transition={{ duration: 0.3 }}>
                            <EtapaInformacoes formData={formData} setFormData={setFormData} avancar={avancar} />
                        </motion.div>
                    )}
                    
                    {etapa === 2 && (
                        <motion.div key="materias" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} transition={{ duration: 0.3 }}>
                            <EtapaMateriasPrimas formData={formData} setFormData={setFormData} avancar={avancar} voltar={voltar} onError={showError} />
                        </motion.div>
                    )}
                    
                    {etapa === 3 && (

                        <motion.div key="resumo" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
                           
                            <EtapaResumo formData={formData}
                            onClose={() => {
                                setProdutoSalvo(true);
                                setEtapa(1);
                                setModalMateriaAberto(false);
                                onClose();
                            }} onSave={onSave} voltar={voltar} produto={produto} onSuccess={showSuccess} onError={showError} />

                        </motion.div>
                        
                    )}

                </AnimatePresence>
            </div>
        </div>
        
        <AnimatePresence>
            
            {modalMateriaAberto && (
                <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
                    <ModalMateriaPrima isOpen={modalMateriaAberto} onClose={() => setModalMateriaAberto(false)} onSave={(materia) => { handleAddMateria(materia); }} />
                </motion.div>
            )}
            
        </AnimatePresence>
        
    </div>

    <ConfirmacaoModal isOpen={confirmarSaidaAberto} onClose={() => setConfirmarSaidaAberto(false)} onConfirm={confirmarSaida} title="Sair" message="Tem certeza que deseja sair? Seu produto não será salvo." />     
 
  </div>
  );
};

export default ModalProduto;