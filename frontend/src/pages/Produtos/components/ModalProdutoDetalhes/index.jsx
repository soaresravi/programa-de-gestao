import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

import api from '../../../../services/api';
import ModalMateriasPrimas from './ModalMateriasPrimas';
import ConfirmacaoModal from '../ModalProduto/ConfirmacaoModal';
import styles from './ModalProdutoDetalhes.module.scss';

const formatarModelo = (modelo) => {

  const modelos = {
   
    'SOLTEIRO': 'Solteiro',
    'SOLTEIRAO': 'Solteirão',
    'CASAL': 'Casal',
    'VIUVO': 'Viúvo',
    'CASAL_BIPARTIDO': 'Casal bipartido',
    'QUEEN': 'Queen',
    'KING': 'King',

  };

  return modelos[modelo] || modelo;

};

const formatarEspecificacao = (especificacao) => {

  const especificacoes = {
    
    'CINCO_CM': '5 cm',
    'DEZ_CM': '10 cm',
    'QUINZE_CM': '15 cm',
    'MOLA_POLIESTER': 'Mola ensacada Poliéster',
    'MOLA_MALHA': 'Mola ensacada Malha',
    'DOIS_POR_UM': '2x1 sem baú',
    'TRES_POR_UM_BAU_DEZ_CM': '3x1 com baú (10cm)',
    'TRES_POR_UM_BAU_DUAS_10_CM': '3x1 com baú (10cm nas 2 camas)',
    'D23': 'D23',
    'D28': 'D28',
    'D33': 'D33',
    'D45': 'D45',
    'SPLENDIDA': 'Splendida',
    'HAVANA': 'Havana',
 
  };

  return especificacoes[especificacao] || especificacao || 'Sem especificação';

};

const ModalProdutoDetalhes = ({ isOpen, onClose, produto, onSave, showSuccess, showError }) => {

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [fotoPreview, setFotoPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [modalMateriasAberto, setModalMateriasAberto] = useState(false);
  const [confirmarSaidaAberto, setConfirmarSaidaAberto] = useState(false);
  const [confirmarExclusaoAberto, setConfirmarExclusaoAberto] = useState(false);
  const [originalData, setOriginalData] = useState({});

  useEffect(() => {

    if (produto) {
      setFormData(produto);
      setFotoPreview(produto.fotoURL || '');
      setModalMateriasAberto(false);
    }
        
  }, [produto]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleImageUpload = async (e) => {

    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image/jpeg') && !file.type.match('image.jpg') && !file.type.match('image/png')) {
      if (showError) showError('Por favor, selecione uma imagem JPG, JPEG ou PNG');
      return;
    }

    setUploading(true);
    const formDataImg= new FormData();
    formDataImg.append('image', file);

    try {

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`, { method: 'POST', body: formDataImg, });
      const data = await response.json();

      if (data.success) {
        setFotoPreview(data.data.url);
        handleChange('fotoURL', data.data.url);
      } else {
        if (showError) showError('Erro ao fazer upload da imagem');
      }

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      if (showError) showError('Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
    
  };

  const removeImage = () => {
    setFotoPreview('');
    handleChange('fotoURL', '');
  };

  const handleSave = async () => {

    try {

      const dadosParaEnviar = {

        nome: formData.nome,
        tipo: formData.tipo,
        modelo: formData.modelo,
        comprimento: formData.comprimento ? parseFloat(formData.comprimento) : null,
        largura: formData.largura ? parseFloat(formData.largura) : null,
        altura: formData.altura ? parseFloat(formData.altura) : null,
        espessura: formData.espessura ? parseFloat(formData.espessura) : null,
        acabamento: formData.acabamento || null,
        especificacao: formData.especificacao,
        precoVenda: formData.precoVenda ? parseFloat(formData.precoVenda) : 0,
        fotoURL: formData.fotoURL,
        materiasPrimas: formData.materiasPrimas || []
   
      };

      await api.put(`/produtos/${produto.id}`, dadosParaEnviar);
      if (showSuccess) showSuccess('Produto atualizado com sucesso!');
            
      onSave();
      setIsEditing(false);
      onClose();

    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      if (showError) showError('Erro ao salvar produto');
    }

  };

  const handleEdit = () => {
    setOriginalData({ ...formData });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(originalData);  
    setFotoPreview(originalData.fotoURL || '');
    setIsEditing(false);
  };

  const handleDelete = async () => {

    try {

      await api.delete(`/produtos/${produto.id}`);
      if (showSuccess) showSuccess('Produto excluído com sucesso!');
      onSave();
      onClose();
      
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      if (showError) showError('Erro ao excluir produto');
    }

  };

  const handleClose = () => {

    if (isEditing) {
      setConfirmarSaidaAberto(true);
    } else {
      setModalMateriasAberto(false); 
      onClose();
    }

  };

  const confirmarSaida = () => {
    setConfirmarSaidaAberto(false);
    setIsEditing(false);
    setFormData(produto);
    setFotoPreview(produto?.fotoURL || '');
    onClose();
  };

  const tiposProduto = [
    { value: 'CAMA_CONJUGADA', label: 'Cama' },
    { value: 'BICAMA', label: 'Bicama' },
    { value: 'BASE_BOX', label: 'Base' },
    { value: 'BOX_BAU', label: 'Baú' },
    { value: 'COLCHAO_MOLA', label: 'Colchão de mola' },
    { value: 'COLCHAO_ESPUMA', label: 'Colchão de espuma' },
  ];
    
  const modelosCama = [
    { value: 'SOLTEIRO', label: 'Solteiro' },
    { value: 'CASAL', label: 'Casal' },
  ];
    
  const modelosBauBaseColchao = [
    { value: 'SOLTEIRO', label: 'Solteiro' },
    { value: 'SOLTEIRAO', label: 'Solteirão' },
    { value: 'CASAL', label: 'Casal' },
    { value: 'VIUVO', label: 'Viúvo' },
    { value: 'CASAL_BIPARTIDO', label: 'Casal bipartido' },
    { value: 'QUEEN', label: 'Queen' },
    { value: 'KING', label: 'King' },
  ];

  const getModelosDisponiveis = () => {

    switch (formData.tipo) {
      case 'CAMA_CONJUGADA': return modelosCama;
      default: return modelosBauBaseColchao;
    }

  };

  const getEspecificacoesDisponiveis = () => {
    
    switch (formData.tipo) {
      
      case 'CAMA_CONJUGADA':
       
        return [
          { value: 'CINCO_CM', label: '5 cm' },
          { value: 'DEZ_CM', label: '10 cm' },
          { value: 'QUINZE_CM', label: '15 cm' },
          { value: 'MOLA_POLIESTER', label: 'Mola ensacada Poliéster' },
          { value: 'MOLA_MALHA', label: 'Mola ensacada Malha' },
        ];

      case 'COLCHAO_ESPUMA':
        
        return [
          { value: 'D23', label: 'D23' },
          { value: 'D28', label: 'D28' },
          { value: 'D33', label: 'D33' },
          { value: 'D45', label: 'D45' },
        ];
        
      case 'COLCHAO_MOLA':
       
        return [
          { value: 'SPLENDIDA', label: 'Splendida' },
          { value: 'HAVANA', label: 'Havana' },
        ];

      case 'BICAMA':
        
        return [
          { value: 'CINCO_CM', label: '5 cm' },
          { value: 'DEZ_CM', label: '10 cm' },
          { value: 'DOIS_POR_UM', label: '2x1 sem baú' },
          { value: 'TRES_POR_UM_BAU_DEZ_CM', label: '3x1 com baú (10cm)' },
          { value: 'TRES_POR_UM_BAU_DUAS_10_CM', label: '3x1 com baú (10cm nas 2 camas)' },
        ];

      default:
        return [];
    }
  };

  const acabamentos = [
    { value: 'SUEDE', label: 'Suede' },
    { value: 'CORINO', label: 'Corino' },
    { value: 'MALHA', label: 'Malha' },
    { value: 'TSM', label: 'TSM' },
    { value: 'POLIESTER', label: 'Poliéster' },
  ];

  const custoTotal = formData.tipo === 'MATERIA_PRIMA' ? (formData.custoProducao || 0) : formData.materiasPrimas?.reduce((total, mp) => total + (mp.quantidade * mp.valorUnitarioNoMomento), 0) || 0;
  const lucro = (formData.precoVenda || 0) - custoTotal;

  if (!isOpen) return null;

  return (
  
  <div className={styles.overlay} onClick={handleClose}>
    <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
      <div className={styles.modal}>

        <div className={styles.modalHeader}>   
          <h2 className={styles.modalTitle}> {formData.nome} <span className={styles.productId}>• ID #{produto?.id}</span> </h2>
          <button className={styles.closeButton} onClick={handleClose}> <X size={20} /> </button>
        </div>
    
        <div className={`${styles.modalContent} ${isEditing ? styles.isEditing : ''}`}>
          
          {(fotoPreview || isEditing) && (
          
            <>
              
              <div className={styles.divider} />
              <h3 className={styles.sectionTitle}>Imagem do produto</h3>
              
              <div className={styles.imageContainer}>
                
                {fotoPreview ? (
                
                  <>
                  
                    {isEditing && (

                      <div className={styles.imageActions}>
                        <button className={styles.removeImageBtn} onClick={removeImage}> X Remover imagem </button>
                      </div>
                    )}
                    
                    <img src={fotoPreview} alt="Produto" className={styles.imagePreview} />

                  </>

                ) : (
                  
                  isEditing && (
                  
                    <div className={styles.uploadContainer}>
                      <input type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleImageUpload} />
                      {uploading && <p>Enviando imagem...</p>}
                      <p className={styles.uploadHint}>Formatos aceitos: JPG, JPEG, PNG</p>
                    </div>

                  )
                )}
              </div>
            </>
          )}
          
          <div className={styles.divider} />
          <h3 className={styles.sectionTitle}>Informações do produto:</h3>
          
          <div className={styles.formGrid}>
            <div className={styles.formRow}>
             
              <div className={styles.inputGroup}>
                
                <label className={styles.label}>Nome:</label>
                  
                  {isEditing ? (
                    <input type="text" className={styles.input} style={{ width: "100px", overflowX: "auto", whiteSpace: "nowrap"}} value={formData.nome || ''} onChange={(e) => handleChange('nome', e.target.value)} />
                  ) : (
                    <span className={styles.value} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100px", display: "inline-block"}}>{formData.nome || '-'}</span>
                  )}

              </div>
              
              <div className={styles.inputGroup}>
                
                <label className={styles.label}>Tipo:</label>
                
                {isEditing ? (

                  <select className={styles.select} value={formData.tipo || ''} onChange={(e) => handleChange('tipo', e.target.value)}>
                    <option value="">Selecione</option>
                    {tiposProduto.map(t => (<option key={t.value} value={t.value}>{t.label}</option>))}
                  </select>

                ) : (
                  <span className={styles.value}>{tiposProduto.find(t => t.value === formData.tipo)?.label || '-'}</span>
                )}

              </div>
            </div>
            
            <div className={styles.formRow}>

              <div className={styles.inputGroup}>
                
                <label className={styles.label}>Modelo:</label>
                
                {isEditing ? (
                
                  <select className={styles.select} value={formData.modelo || ''} onChange={(e) => handleChange('modelo', e.target.value)}>
                    <option value="">Selecione</option>
                    {getModelosDisponiveis().map(m => (<option key={m.value} value={m.value}>{m.label}</option>))}
                  </select>
                
                ) : (
                  <span className={styles.value}>{formatarModelo(formData.modelo) || '-'}</span>
                )}

              </div>
              
              <div className={styles.inputGroup}>
                
                <label className={styles.label}>Acabamento:</label>
                
                {isEditing ? (

                  <select className={styles.select} value={formData.acabamento || ''} onChange={(e) => handleChange('acabamento', e.target.value)}>
                    <option value="">Selecione</option>
                    {acabamentos.map(a => (<option key={a.value} value={a.value}>{a.label}</option>))}
                  </select>
                
                ) : (
                  <span className={styles.value}>{acabamentos.find(a => a.value === formData.acabamento)?.label || '-'}</span>
                )}

              </div>
            </div>

            <div className={styles.formRow}>
              
              <div className={styles.inputGroup}>
                
                <label className={styles.label} style={{ marginRight: "70px"}}>Comprimento (m):</label>
                
                {isEditing ? (
                  <input type="text" className={styles.inputDimensao} value={formData.comprimento || ''} onChange={(e) => handleChange('comprimento', e.target.value)} />
                ) : (
                  <span className={styles.valueDimensao}>{formData.comprimento || '-'}</span>
                )}

              </div>
              
              <div className={styles.inputGroup}>
                
                <label className={styles.label} style={{ marginRight: "107px"}}>Largura (m):</label>
                
                {isEditing ? (
                  <input type="text" className={styles.inputDimensao} value={formData.largura || ''} onChange={(e) => handleChange('largura', e.target.value)} />
                ) : (
                  <span className={styles.valueDimensao}>{formData.largura || '-'}</span>
                )}

              </div>
            </div>

            <div className={styles.formRow}>
              
              <div className={styles.inputGroup}>
                
                <label className={styles.label} style={{ marginRight: "105px"}}>Altura (m):</label>
                
                {isEditing ? (
                  <input type="text" className={styles.inputDimensao} value={formData.altura || ''} onChange={(e) => handleChange('altura', e.target.value)} />
                ) : (
                  <span className={styles.valueDimensao}>{formData.altura || '-'}</span>
                )}

              </div>
              
              <div className={styles.inputGroup}>
            
                <label className={styles.label} style={{ marginRight: "100px"}}>Espessura (m):</label>
            
                {isEditing ? (
                  <input type="text" className={styles.inputDimensao} value={formData.espessura || ''} onChange={(e) => handleChange('espessura', e.target.value)} />
                ) : (
                  <span className={styles.valueDimensao}>{formData.espessura || '-'}</span>
                )}
            
              </div>

            </div>
    
            <div className={styles.formRow}>

              <div className={styles.inputGroup}>
                
                <label className={styles.label}>Especificação:</label>
                
                {isEditing ? (
                
                  <select className={styles.select} style={{ width: "100px"}} value={formData.especificacao || ''} onChange={(e) => handleChange('especificacao', e.target.value)}>
                    <option value="">Selecione</option>
                    {getEspecificacoesDisponiveis().map(opt => ( <option key={opt.value} value={opt.value}>{opt.label}</option> ))}
                  </select>

                ) : (
                  <span className={styles.value}>{formatarEspecificacao(formData.especificacao) || '-'}</span>
                )}

              </div>
    
              <div className={styles.inputGroup}>
                
                <label className={styles.label} style={{ marginRight: "55px"}}>Valor da venda:</label>
                
                {isEditing ? (
                  <input type="number" step="0.01" className={styles.inputPrice} style={{ width: "120px"}} value={formData.precoVenda || ''} onChange={(e) => handleChange('precoVenda', parseFloat(e.target.value))} />
                ) : (
                  <span className={styles.valuePrice}>R$ {formData.precoVenda?.toFixed(2) || '0,00'}</span>
                )}

              </div>
            </div>
          </div>
    
          <div className={styles.divider} />
          <h3 className={styles.sectionTitle} style={{ marginBottom: "5px"}}>Custo de produção do produto:</h3>
          <button className={styles.viewMateriasBtn} onClick={() => setModalMateriasAberto(true)}> Ver matérias-primas utilizadas na fabricação </button>

          <div className={styles.custoInfo}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              
              <p style={{ margin: 0 }}>
                <span className={styles.custoLabel}>Custo TOTAL de fabricação:</span>
                <span className={styles.custoValue}>R$ {custoTotal.toFixed(2)}</span>
              </p>
              
              <p style={{ margin: 0 }}>
                <span className={styles.itensLabel}>Total de itens:</span>
                <span>{formData.materiasPrimas?.length || 0}</span>
              </p>

            </div>
            
            <p style={{ margin: 0 }}>
              <span className={styles.lucroLabel}>Lucro:</span>
              <span className={styles.lucroValue}>R$ {lucro.toFixed(2)}</span>
            </p>

          </div>
          
          <div className={styles.buttonRow}>
            <button className={styles.editButton} onClick={isEditing ? handleCancel : handleEdit}> {isEditing ? 'Cancelar edição' : 'Editar informações do produto'} </button>
            <button className={isEditing ? styles.saveButton : styles.deleteButton} onClick={isEditing ? handleSave : () => setConfirmarExclusaoAberto(true)}> {isEditing ? 'Salvar alterações' : 'Excluir produto'} </button>
          </div>

        </div>
      </div>

      {modalMateriasAberto && (
      
        <div className={styles.columnContainer}>
          <ModalMateriasPrimas produtoId={produto?.id} materiasPrimas={formData.materiasPrimas || []} onUpdate={(novasMaterias) => { setFormData({ ...formData, materiasPrimas: novasMaterias }); }}
          onClose={() => setModalMateriasAberto(false)} showSuccess={showSuccess} showError={showError} />
        </div>
      
      )}

    </div>

    <ConfirmacaoModal isOpen={confirmarSaidaAberto} onClose={() => setConfirmarSaidaAberto(false)} onConfirm={confirmarSaida} title="Sair" message="Tem certeza que deseja sair? As alterações não serão salvas." />
    <ConfirmacaoModal isOpen={confirmarExclusaoAberto} onClose={() => setConfirmarExclusaoAberto(false)} onConfirm={handleDelete} title="Excluir produto" message="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita." />
  
  </div>
  );
  
};

export default ModalProdutoDetalhes;