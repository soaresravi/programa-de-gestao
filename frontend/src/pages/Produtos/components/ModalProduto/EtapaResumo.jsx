import React from 'react';
import { ChevronLeft } from 'lucide-react';

import api from '../../../../services/api';
import styles from './ModalProduto.module.scss';

const EtapaResumo = ({ formData, onClose, onSave, voltar, produto, onSuccess, onError }) => {

  const custoTotal = formData.materiasPrimas.reduce( (total, mp) => total + (mp.quantidade * mp.valorUnitarioNoMomento), 0 );
  const lucro = formData.precoVenda - custoTotal;

  const handleSubmit = async () => {

    if (!formData.precoVenda || formData.precoVenda <= 0) {
      if (onError) onError('Por favor, informe o valor de venda do produto');
      return;
    }

    if (!formData.nome) {
      if (onError) onError('Por favor, informe o nome do produto');
      return;
    }

    if (!formData.tipo) {
      if (onError) onError('Por favor, selecione o tipo do produto');
      return;
    }
    
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
      
        materiasPrimas: formData.materiasPrimas.map(mp => ({
          nome: mp.nome,
          quantidade: parseInt(mp.quantidade),
          valorUnitarioNoMomento: parseFloat(mp.valorUnitarioNoMomento)
        }))
        
      };
      
      if (produto) {
        await api.put(`/produtos/${produto.id}`, dadosParaEnviar);
      } else {
        await api.post('/produtos', dadosParaEnviar);
      }
    
      onSave();
      onClose();
      
      if (onSuccess) onSuccess('Produto adicionado com sucesso!');
  
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      if (onError) onError(error.response?.data?.message || 'Erro ao salvar produto. Tente novamente.');
    }

  };

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
  
  return (
  
  <div>
  
    {formData.fotoURL && ( 
    <>  
      <h4 className={styles.label} style={{ fontSize: "18px", marginBottom: "20px"}}>Imagem do produto:</h4>
      <img src={formData.fotoURL} alt="Produto" className={styles.imagePreview} />
      <div className={styles.divider} />
    </>
    )}
  
    <h4 className={styles.label} style={{ fontSize: "18px", marginBottom: "10px" }}>Informações do produto:</h4>
    <p> <strong>{formData.nome}</strong> • {formatarModelo(formData.modelo)} • {formatarEspecificacao(formData.especificacao, formData.tipo)} {formData.comprimento && ` • ${formData.comprimento}m x ${formData.largura}m`} </p>

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', marginTop: "5px"}}>
      <p style={{ color: '#02323C', margin: 0 }}><strong>Valor da venda: <span style={{ color: 'black', marginLeft: '5px', marginRight: '20px'}}> R$ {formData.precoVenda?.toFixed(2) || '0,00'} </span> </strong> </p>
      <p style={{ color: '#02323C', margin: 0 }}><strong>Custo TOTAL de fabricação: <span style={{ color: '#dc2626', marginLeft: '5px' }}>R$ {custoTotal.toFixed(2)} </span> </strong> </p>
    </div>

    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <p style={{ color: '#02323C', margin: 0 }}><strong>Lucro: <span style={{ color: '#307060'}}>R$ {lucro.toFixed(2)} </span> </strong> </p>
    </div>
  
    <div className={styles.buttonRow}>
      <button className={styles.buttonOutline} onClick={voltar}> <ChevronLeft size={25} /> Voltar </button>
      <button className={styles.button} style={{ fontSize: "17px", padding: "4px 12px"}} onClick={handleSubmit}> Adicionar produto </button>
    </div>
    
  </div>
  );
};

export default EtapaResumo;