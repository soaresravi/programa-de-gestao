import React, { useState, useEffect } from 'react';
import { Search, Plus, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSidebar } from '../../contexts/SidebarContext';

import ModalProdutoDetalhes from './components/ModalProdutoDetalhes';
import Sidebar from '../../components/Sidebar';
import CardProduto from './components/CardProduto';
import api from '../../services/api';
import styles from './Produtos.module.scss';
import ModalProduto from './components/ModalProduto';
import ModalMateriaPrimaProduto from './components/ModalMateriaPrimaProduto';
import { useToast } from '../../hooks/useToast';
import ToastContainer from './components/Toast/ToastContainer';

const agruparPorTipo = (produtos) => {

  if (!produtos) return {};

  return produtos.reduce((grupos, produto) => {

    const tipoFormatado = formatarTipoGrupo(produto.tipo);

    if (!grupos[tipoFormatado]) {
      grupos[tipoFormatado] = [];
    }

    grupos[tipoFormatado].push(produto);
    return grupos;

  }, {});

};

const formatarTipoGrupo = (tipo) => {

  const tipos = {
    'CAMA_CONJUGADA': 'Cama',
    'BICAMA': 'Bicama',
    'BASE_BOX': 'Base',
    'BOX_BAU': 'Baú',
    'COLCHAO_MOLA': 'Colchão de mola',
    'COLCHAO_ESPUMA': 'Colchão de espuma',
    'MATERIA_PRIMA' : 'Matéria-prima',
  };

  return tipos[tipo] || tipo;

}

const Produtos = () => {

  const [search, setSearch] = useState('');
  const [tipo, setTipo] = useState('');
  const [modelo, setModelo] = useState('');
  const [ordenar, setOrdenar] = useState('nome_asc');
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [usuario, setUsuario] = useState({ nome: '' });
  const { isExpanded } = useSidebar();
  const [modalMateriaPrimaProduto, setModalMateriaPrimaProduto] = useState(false);
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [produtoDetalhes, setProdutoDetalhes] = useState(null);

  useEffect(() => {
    
    const buscarNomeUsuario = async () => {

      const nomeSalvo = localStorage.getItem('usuarioNome');

      if (nomeSalvo && nomeSalvo !== 'Usuário') {
        setUsuario({ nome: nomeSalvo });
        return;
      }
      
      const token = localStorage.getItem('token');

      if (token) {

        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const nome = payload.nome || payload.upn?.split('@')[0] || 'Usuário';
          setUsuario({ nome });
          localStorage.setItem('usuarioNome', nome);
          return;
        } catch (error) {
          console.error('Erro ao decodificar token', e);
        }

      }

      api.get('/auth/me').then(response => {
        setUsuario({ nome: response.data.nome });
        localStorage.setItem('usuarioNome', response.data.nome);
      }).catch(() => {
        setUsuario({ nome: 'Usuário' });
      });

    };
      
    buscarNomeUsuario();
  
  }, []);

  const { data: produtos, refetch} = useQuery({
        
    queryKey: ['produtos', tipo, modelo, search, ordenar],

    queryFn: async () => {

      const params = new URLSearchParams();

      if (tipo) params.append('tipoProduto', tipo);
      if (modelo) params.append('modelo', modelo);
      if (search) params.append('search', search);
      if (ordenar) params.append('ordenar', ordenar);

      const response = await api.get(`/produtos?${params.toString()}`);
      return response.data;

    },

  });

  const produtosAgrupados = agruparPorTipo(produtos);

  const tiposProdutos = [
    { value: '', label: 'Selecionar tipo de produto' },
    { value: 'CAMA_CONJUGADA', label: 'Cama' },
    { value: 'BICAMA', label: 'Bicama' },
    { value: 'BASE_BOX', label: 'Base' },
    { value: 'BOX_BAU', label: 'Baú' },
    { value: 'COLCHAO_MOLA', label: 'Colchão de mola' },
    { value: 'COLCHAO_ESPUMA', label: 'Colchão de espuma' },
    { value: 'MATERIA_PRIMA', label: 'Matéria-prima '},
  ];

  const modelos = [
    { value: '', label: 'Todos' },
    { value: 'SOLTEIRO', label: 'Solteiro' },
    { value: 'CASAL', label: 'Casal' },
    { value: 'QUEEN', label: 'Queen' },
    { value: 'KING', label: 'King' },
  ];
    
  const ordenarOpcoes = [
    { value: 'nome_asc', label: 'Nome A-Z' },
    { value: 'nome_desc', label: 'Nome Z-A' },
    { value: 'preco_asc', label: 'Menor preço' },
    { value: 'preco_desc', label: 'Maior preço' },
  ];
  
  const handleAbrirModalCriacao = (produto = null) => {
    setProdutoSelecionado(produto);
    setModalAberto(true);
  };

  const handleFecharModal = () => {
    setProdutoSelecionado(null);
    setModalAberto(false);
    refetch();
  };

  const handleAbrirDetalhes = (produto) => {
    setProdutoDetalhes(produto);
    setModalDetalhesAberto(true);
  };
  
  return (
    
    <div className={styles.container}>
      
      <Sidebar />
      
      <div className={styles.content} style={{ marginLeft: isExpanded ? '250px' : '70px' }}>

        <div className={styles.header}>
          
          <div>
            <h1 className={styles.title}>Olá, {usuario.nome}!</h1>
            <p className={styles.subtitle}>Gerencie os produtos oferecidos aos seus clientes</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center'}}>
            <button className={styles.addButtonMateria} onClick={() => setModalMateriaPrimaProduto(true)}> <Package size={20} /> Adicionar matéria-prima </button>
            <button className={styles.addButton} onClick={() => handleAbrirModalCriacao()}> <Plus size={22} strokeWidth={2.5} /> Adicionar cama </button>
          </div>
        
        </div>
    
        <div className={styles.divider} />
    
        <div className={styles.filters}>

          <div className={styles.filterGroup}>
            
            <select className={styles.filterSelect} value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {tiposProdutos.map(t => ( <option key={t.value} value={t.value}>{t.label}</option> ))}
            </select>

            <div className={styles.modeloContainer}>

              {modelos.map((m, index) => (
                <button key={m.value} className={`${styles.modeloButton} ${modelo === m.value ? styles.active : ''} ${index !== 0 ? styles.withDivider : ''}`} onClick={() => setModelo(m.value)}> {m.label} </button>
              ))}

            </div>
          </div>
    
          <div className={styles.searchGroup}>

            <div className={styles.ordenarGroup} style={{ marginRight: isExpanded ? '0px' : '260px' }}>
              
              <span style={{ fontWeight: 700, color: '#307060', fontSize: '16px'}}> Ordenar por:</span>

              <select className={styles.ordenarSelect} value={ordenar} onChange={(e) => setOrdenar(e.target.value)}>
                {ordenarOpcoes.map(o => ( <option key={o.value} value={o.value}>{o.label}</option> ))}
              </select>

            </div>

            <div className={styles.searchInput}>  
              <Search size={20} strokeWidth={2.5} />
              <input type="text" placeholder="Pesquisar produtos..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

          </div>
        </div>
    
        <div className={styles.produtosHeader}>
          <h2>Produtos</h2>
          <span className={styles.count}>{produtos?.length || 0} produtos</span>
        </div>
    
        <div className={styles.produtosContainer}>
          
          {Object.entries(produtosAgrupados).map(([tipo, produtosDoTipo]) => (
          
          <div key={tipo} className={styles.grupoContainer}>
            
            <h3 className={styles.grupoTitle}>{tipo}</h3>
            
            <div className={styles.grid}>

              {produtosDoTipo.map(produto => (
                <CardProduto key={produto.id} produto={produto} onClick={() => handleAbrirDetalhes(produto)} />
              ))}

            </div>

          </div>
          ))}
        </div>
      </div>
    
      <ModalProduto isOpen={modalAberto} onClose={handleFecharModal} produto={produtoSelecionado} onSave={refetch} showSuccess={showSuccess} showError={showError} />
      <ModalMateriaPrimaProduto isOpen={modalMateriaPrimaProduto} onClose={() => setModalMateriaPrimaProduto(false)} onSave={refetch} onSuccess={() => showSuccess('Matéria-prima adicionada com sucesso!')} onError={showError} />
     
      <ModalProdutoDetalhes isOpen={modalDetalhesAberto}
      
      onClose={() => {
        setModalDetalhesAberto(false);
        setProdutoDetalhes(null);
      }} produto={produtoDetalhes} onSave={refetch} showSuccess={showSuccess} showError={showError} />

      <ToastContainer toasts={toasts} onClose={removeToast} />
      
    </div>
  );

}

export default Produtos;