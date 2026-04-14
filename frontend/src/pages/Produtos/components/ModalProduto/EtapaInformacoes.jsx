import React, { useState } from 'react';
import  styles from './ModalProduto.module.scss';

const EtapaInformacoes = ({ formData, setFormData, avancar }) => {

  const [fotoPreview, setFotoPreview] = useState(formData.fotoURL || '');
  const [uploading, setUploading] = useState(false);

  React.useEffect(() => {
    setFotoPreview(formData.fotoURL || '');
  }, [formData.fotoURL]);

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

  const modelosBicama = [
    { value: 'SOLTEIRO', label: 'Solteiro' },
  ];

  const especificacoesCama = [
    { value: 'CINCO_CM', label: '5 cm' },
    { value: 'DEZ_CM', label: '10 cm' },
    { value: 'QUINZE_CM', label: '15 cm' },
    { value: 'MOLA_POLIESTER', label: 'Mola ensacada Poliéster' },
    { value: 'MOLA_MALHA', label: 'Mola ensacada Malha' },
  ];

  const especificacoesColchaoEspuma = [
    { value: 'D23', label: 'D23' },
    { value: 'D28', label: 'D28' },
    { value: 'D33', label: 'D33' },
    { value: 'D45', label: 'D45' },
  ];

  const especificacoesColchaoMola = [
    { value: 'SPLENDIDA', label: 'Splendida' },
    { value: 'HAVANA', label: 'Havana' },
  ];

  const especificacoesBicama = [
    { value: 'CINCO_CM', label: '5 cm' },
    { value: 'DEZ_CM', label: '10 cm' },
    { value: 'DOIS_POR_UM', label: '2x1 sem baú' },
    { value: 'TRES_POR_UM_BAU_DEZ_CM', label: '3x1 com baú (10cm)' },
    { value: 'TRES_POR_UM_BAU_DUAS_10_CM', label: '3x1 com baú (10cm nas 2 camas)' },
  ];

  const acabamentos = [
    { value: 'SUEDE', label: 'Suede' },
    { value: 'CORINO', label: 'Corino' },
    { value: 'MALHA', label: 'Malha' },
    { value: 'TSM', label: 'TSM' },
    { value: 'POLIESTER', label: 'Poliéster' },
  ];

  const getModelosDisponiveis = () => {

    switch (formData.tipo) {
      case 'CAMA_CONJUGADA': return modelosCama;
      case 'BICAMA': return modelosBicama;
      default: return modelosBauBaseColchao;
    }

  };

  const getEspecificacoesDisponiveis = () => {
    
    switch (formData.tipo) {
      case 'CAMA_CONJUGADA': return especificacoesCama;
      case 'COLCHAO_ESPUMA': return especificacoesColchaoEspuma;
      case 'COLCHAO_MOLA': return especificacoesColchaoMola;
      case 'BICAMA': return especificacoesBicama;
      default: return [];
    }

  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleImageUpload = async (e) => {

    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image/jpeg') && !file.type.match('image.jpg') && !file.type.match('image/png')) {
      alert('Por favor, selecione uma imagem nos formatos de: JPG, JPEG ou PNG');
      return;
    }
    
    setUploading(true);
    const formDataImg = new FormData();
    formDataImg.append('image', file);

    try {

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`, { method: 'POST', body: formDataImg, });
      const data = await response.json();

      if (data.success) {
        setFotoPreview(data.data.url);
        handleChange('fotoURL', data.data.url);
      } else {
        alert('Erro ao fazer upload da imagem');
      }

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }

  };

  const removeImage = () => {
    setFotoPreview('');
    handleChange('fotoURL', '');
  };

  return (
  
  <div>
    
    <h3 className={styles.sectionTitle}>Informações do produto:</h3>

    <div className={styles.formGrid}>
      <div className={styles.formRow}>

        <div className={styles.inputGroup}> 
          <label className={styles.label}>Nome:</label>
          <input type="text" className={styles.input} value={formData.nome} onChange={(e) => handleChange('nome', e.target.value)} placeholder="Ex: Cama Box Casal 5cm" />
        </div>
        
        <div className={styles.inputGroup}>
         
          <label className={styles.label} style={{ marginRight: "13px" }}>Tipo:</label>
         
          <select className={styles.select} value={formData.tipo || ""}
          
          onChange={(e) => {
            const novoTipo = e.target.value;
            setFormData(prev => ({  ...prev, tipo: novoTipo, modelo: '', especificacao: '' }));
          }}>
            
            <option value="">Selecione</option>
            
            {tiposProduto.map(t => ( <option key={t.value} value={t.value}>{t.label}</option> ))}

          </select>
        </div>
      </div>
      
      <div className={styles.formRow}>  
        <div className={styles.inputGroup}>
          
          <label className={styles.label}>Modelo:</label>
          
          <select className={styles.select} value={formData.modelo} onChange={(e) => handleChange('modelo', e.target.value)}>
            <option value="">Selecione</option>
            {getModelosDisponiveis().map(m => ( <option key={m.value} value={m.value}>{m.label}</option> ))}
          </select>

        </div>
        
        <div className={styles.inputGroup}>

          <label className={styles.label}>Acabamento:</label>
          
          <select className={styles.select} value={formData.acabamento || ""} onChange={(e) => handleChange('acabamento', e.target.value)}>
            <option value="">Selecione</option>
            {acabamentos.map(a => ( <option key={a.value} value={a.value}>{a.label}</option> ))}
          </select>

        </div>
      </div>
      
      <div className={styles.formRow}>
        
        <div className={styles.inputGroup}>
          
          <label className={styles.label} style={{ marginRight: "70px"}}>Comprimento (m):</label>
          
          <input type="text" className={`${styles.input} ${styles.inputDimensao}`} value={formData.comprimento} onChange={(e) => handleChange('comprimento', e.target.value)}
          onBlur={(e) => {
            
            let valor = e.target.value.replace(',', '.');
            let numero = parseFloat(valor);
           
            if (!isNaN(numero)) {
              handleChange('comprimento', numero);
            }

          }} placeholder="1.88" />

        </div>
        
        <div className={styles.inputGroup}>
          
          <label className={styles.label} style={{ marginRight: "115px"}}>Largura (m):</label>
          
          <input type="text" className={`${styles.input} ${styles.inputDimensao}`} value={formData.largura} onChange={(e) => handleChange('largura', e.target.value)}
          onBlur={(e) => {
          
            let valor = e.target.value.replace(',', '.');
            let numero = parseFloat(valor);
            
            if (!isNaN(numero)) {
              handleChange('largura', numero);
            }

          }} placeholder="1.38" />

        </div>
      </div>
      
      <div className={styles.formRow}>

        <div className={styles.inputGroup}>
          
          <label className={styles.label} style={{ marginRight: "125px"}}>Altura (m):</label>
          
          <input type="text" className={`${styles.input} ${styles.inputDimensao}`} value={formData.altura} onChange={(e) => handleChange('altura', e.target.value)}
          onBlur={(e) => {
          
            let valor = e.target.value.replace(',', '.');
            let numero = parseFloat(valor);
            
            if (!isNaN(numero)) {
              handleChange('altura', numero);
            }

          }} placeholder="0.45" />

        </div>
        
        <div className={styles.inputGroup}>
          
          <label className={styles.label} style={{ marginRight: "100px"}}>Espessura (m):</label>
          
          <input type="text" className={`${styles.input} ${styles.inputDimensao}`} value={formData.espessura} onChange={(e) => handleChange('espessura', e.target.value)}
          onBlur={(e) => {
         
            let valor = e.target.value.replace(',', '.');
            let numero = parseFloat(valor);
         
            if (!isNaN(numero)) {
              handleChange('espessura', numero);
            }

          }} placeholder="0.05" />

        </div>
      </div>
      
      {getEspecificacoesDisponiveis().length > 0 && (
      
      <div className={styles.formRow}>
        <div className={styles.inputGroup}>
          
          <label className={styles.label}>Especificação:</label>
         
          <select className={styles.select} value={formData.especificacao} onChange={(e) => handleChange('especificacao', e.target.value)}>
            <option value="">Selecione</option>
            {getEspecificacoesDisponiveis().map(e => ( <option key={e.value} value={e.value}>{e.label}</option> ))}
          </select>

        </div>
        
        <div className={styles.inputGroup}></div>

      </div>
      )}
    </div>
    
    <h3 className={styles.sectionTitle}>Imagem do produto:</h3>
    
    <div className={styles.imageContainer}>
      
      {fotoPreview ? (
      
      <>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <button className={styles.removeImage} onClick={removeImage}> X Remover imagem </button>
      </div>

      <img src={fotoPreview} alt="Preview" className={styles.imagePreview} />

      </>

      ) : (
      
      <div className={styles.inputGroup}>

        <input type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleImageUpload} className={styles.input} />

        {uploading && <p>Enviando imagem...</p>}
        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}> Formatos aceitos: JPG, JPEG, PNG </p>

      </div>
      )}

    </div>

    <div className={styles.buttonGroup}>
      <button className={styles.button} onClick={avancar}> Avançar </button>
    </div>
    
  </div>
  );
};

export default EtapaInformacoes;