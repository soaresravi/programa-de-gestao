import React, { useState, useEffect, useRef } from 'react';
import { Search, Calendar, Eraser, Plus, ChevronLeft, ChevronRight, Ellipsis, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { useSidebar } from '../../contexts/SidebarContext';
import Sidebar from '../../components/Sidebar';
import Calendario from '../../components/Calendario/Calendario';
import ModalNovaVenda from './components/ModalNovaVenda';
import ModalVendaDetalhes from './ModalVendaDetalhes';
import api from '../../services/api';
import styles from './Vendas.module.scss';

const Vendas = ({ addToast }) => {

  const [usuario, setUsuario] = useState({ nome: '' });  
  const { isExpanded } = useSidebar();

  const [search, setSearch] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tipoProduto, setTipoProduto] = useState('');
  const [clienteFinal, setClienteFinal] = useState(null);
  const [vendedor, setVendedor] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
 
  const [periodoPreset, setPeriodoPreset] = useState('mes');
  const [dataPersonalizadaInicio, setDataPersonalizadaInicio] = useState('');
  const [dataPersonalizadaFim, setDataPersonalizadaFim] = useState('');
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [vendedoresOriginal, setVendedoresOriginal] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [vendaSelecionadaId, setVendaSelecionadaId] = useState(null);
  const calendarioRef = useRef(null);

  useEffect(() => {
    
    const token = localStorage.getItem('token');
    
    if (token) {
    
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUsuario({ nome: payload.upn?.split('@')[0] || 'Usuário' });
      } catch (error) {
        setUsuario({ nome: 'Usuário' });
      }

    }
    
  }, []);

  useEffect(() => {
    
    const handleClickOutside = (event) => {
    
      if (calendarioRef.current && !calendarioRef.current.contains(event.target)) {
        setMostrarCalendario(false);
      }

    };
  
    if (mostrarCalendario) {
      document.addEventListener('mousedown', handleClickOutside);
    }
  
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };

  }, [mostrarCalendario]);

  useEffect(() => {
       
    if (periodoPreset !== 'personalizado') {
      setMostrarCalendario(false);
    }

  }, [periodoPreset]);

  useEffect(() => {

    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const primeiroDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    const primeiroDiaAno = new Date(hoje.getFullYear(), 0, 1);

    const formatarData = (date) => date.toISOString().split('T')[0];

    if (periodoPreset !== 'personalizado') {
            
      switch (periodoPreset) {

        case 'mes':
          setDataInicio(formatarData(primeiroDiaMes));
          setDataFim(formatarData(hoje));
          break;
                
        case 'ultimos30':      
          const trintaDiasAtras = new Date(hoje);
          trintaDiasAtras.setDate(hoje.getDate() - 30);
          setDataInicio(formatarData(trintaDiasAtras));
          setDataFim(formatarData(hoje));
          break;
                
        case 'mesAnterior':
          setDataInicio(formatarData(primeiroDiaMesAnterior));
          setDataFim(formatarData(ultimoDiaMesAnterior));
          break;
                
        case 'ano':
          setDataInicio(formatarData(primeiroDiaAno));
          setDataFim(formatarData(hoje));
          break;
                
        default:
          break;

      }

    } else {
            
      if (dataPersonalizadaInicio && dataPersonalizadaFim) {
        setDataInicio(dataPersonalizadaInicio);
        setDataFim(dataPersonalizadaFim);
      }

    }

  }, [periodoPreset, dataPersonalizadaInicio, dataPersonalizadaFim]);

  const { data: vendas, refetch, isLoading } = useQuery({
        
    queryKey: ['vendas', page, pageSize, dataInicio, dataFim, tipoProduto, clienteFinal, vendedor, search],
    
    queryFn: async () => {

      const params = new URLSearchParams();

      if (dataInicio) params.append('dataInicio', dataInicio);
      if (dataFim) params.append('dataFim', dataFim);
      if (tipoProduto) params.append('tipoProduto', tipoProduto);
      if (clienteFinal !== null) params.append('clienteFinal', clienteFinal);
      if (vendedor) params.append('vendedor', vendedor);
      if (search) params.append('search', search);

      params.append('page', page);
      params.append('size', pageSize);

      const response = await api.get(`/vendas?${params.toString()}`);
      return response.data;

    },

  });

  const vendasExibidas = vendas?.content || [];

  useEffect(() => {
    if (vendasExibidas.length > 0 && vendedoresOriginal.length === 0) {
      const vendedoresUnicos = [...new Set(vendasExibidas.map(v => v.vendedor).filter(Boolean))];
      setVendedoresOriginal(vendedoresUnicos);
    }
  }, [vendasExibidas]);

  const totalVendas = vendasExibidas.reduce((acc, v) => acc + (v.valorTotal || 0), 0);

  const tiposProduto = [
    { value: '', label: 'Selecionar tipo de produto' },
    { value: 'CAMA_CONJUGADA', label: 'Cama' },
    { value: 'BICAMA', label: 'Bicama' },
    { value: 'BASE_BOX', label: 'Base' },
    { value: 'BOX_BAU', label: 'Baú' },
    { value: 'COLCHAO_MOLA', label: 'Colchão de mola' },
    { value: 'COLCHAO_ESPUMA', label: 'Colchão de espuma' },
    { value: 'MATERIA_PRIMA', label: 'Matéria-prima' },
  ];
  
  const vendedores = [
    { value: '', label: 'Selecionar vendedor' }, ...vendedoresOriginal.map(v => ({ value: v, label: v }))
  ];

  const limparFiltros = () => {
    setPeriodoPreset('mes');
    setTipoProduto('');
    setClienteFinal(null);
    setVendedor('');
    setSearch('');
    setPage(0);
    setDataPersonalizadaInicio('');
    setDataPersonalizadaFim('');
  };

  const limparDatasPersonalizadas = () => {
    setDataPersonalizadaInicio('');
    setDataPersonalizadaFim('');
    setPeriodoPreset('mes');
  };

  const handleAbrirDetalhes = (vendaId) => {
    setVendaSelecionadaId(vendaId);
    setModalDetalhesAberto(true);
  };

  return (
  
  <div className={styles.container}>
        
    <Sidebar />
        
    <div className={styles.headerTop} style={{ marginLeft: isExpanded ? '250px' : '70px' }}>
      <div className={styles.headerTopContent}>
          
          <div className={styles.atalhos}>
            <a href="/produtos" className={styles.atalhoLink}>Catálogo de produtos</a>
            <a href="/cidades" className={styles.atalhoLink}>Cidades/frete</a>
            <a href="/lojistas" className={styles.atalhoLink}>Lojistas</a>
          </div>

      </div>
    </div>
      
    <div className={styles.content} style={{ marginLeft: isExpanded ? '250px' : '70px'}}>
      
      <div className={styles.header}>
       
        <div>
          <h1 className={styles.title}>Olá, {usuario.nome}!</h1>
          <p className={styles.subtitle}>Acompanhe o relatório completo das suas vendas.</p>
        </div>

        <div className={styles.headerButtons}>
          <button className={styles.exportBtn}> Exportar para PDF </button>
          <button className={styles.novaVendaBtn} onClick={() => setShowModal(true)}> <Plus size={20} strokeWidth={4} /> Nova venda </button>
        </div>
        
      </div>
      
      <div className={styles.tabelaContainer}>
        
        <div className={styles.tabelaHeader}>
          
          <h2 className={styles.tabelaTitle}>Vendas</h2>
          
          <div className={styles.searchBox}>
            <Search size={18} strokeWidth={2.5} />
            <input type="text" placeholder="Pesquisar vendas..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

        </div>
  
        <div className={styles.filtros}>
          <div className={styles.filtrosEsquerda}>
            
            <select className={styles.filtroSelect}  style={{ backgroundColor: '#FFF', borderRadius: 0, padding: '6px'}} value={tipoProduto} onChange={(e) => setTipoProduto(e.target.value)}>
              
              {tiposProduto.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}

            </select>
            
            {periodoPreset !== 'personalizado' ? (
            
              <div className={styles.filtroData}>
             
                <Calendar size={18} strokeWidth={2.5} color='#02323C' />
             
                <select className={styles.filtroSelect} style={{ padding: '0 0' }} value={periodoPreset} onChange={(e) => setPeriodoPreset(e.target.value)}>
                  <option value="mes">Este mês</option>
                  <option value="ultimos30">Últimos 30 dias</option>
                  <option value="mesAnterior">Mês anterior</option>
                  <option value="ano">Este ano</option>
                  <option value="personalizado">Personalizado</option>
                </select>
            
              </div>
          
            ) : (
            
              <div className={styles.calendarioWrapper} ref={calendarioRef}>
                <div className={styles.calendarioTrigger} onClick={() => setMostrarCalendario(!mostrarCalendario)}>
                
                  <Calendar size={18} strokeWidth={2.5} />
                  <span> {dataPersonalizadaInicio && dataPersonalizadaFim ? `${new Date(dataPersonalizadaInicio).toLocaleDateString('pt-BR')} - ${new Date(dataPersonalizadaFim).toLocaleDateString('pt-BR')}` : 'Selecione as datas'} </span>
                
                  {(dataPersonalizadaInicio || dataPersonalizadaFim) && (
                 
                    <X size={14} strokeWidth={2.5}
                    onClick={(e) => {
                      e.stopPropagation();
                      limparDatasPersonalizadas();
                    }} style={{ cursor: 'pointer', marginLeft: '4px' }} />
                
                  )}

                </div>
                    
                {mostrarCalendario && (
                
                  <div className={styles.calendarioDropdown}>
                 
                    <Calendario dataInicio={dataPersonalizadaInicio} dataFim={dataPersonalizadaFim}
                    onSelect={(inicio, fim) => {
                      setDataPersonalizadaInicio(inicio.toISOString().split('T')[0]);
                      setDataPersonalizadaFim(fim.toISOString().split('T')[0]);
                    }} onClose={() => setMostrarCalendario(false)} />

                  </div>
                )}
              </div>
            )}
          
            <div className={styles.modeloContainer}>
              <button className={`${styles.modeloButton} ${clienteFinal === null ? styles.active : ''}`} onClick={() => setClienteFinal(null)}> Todos </button>
              <button className={`${styles.modeloButton} ${clienteFinal === true ? styles.active : ''} ${styles.withDivider}`} onClick={() => setClienteFinal(true)}> Cliente </button>
              <button className={`${styles.modeloButton} ${clienteFinal === false ? styles.active : ''} ${styles.withDivider}`} onClick={() => setClienteFinal(false)}> Lojista </button>
            </div>
          
            <select className={styles.filtroSelect} value={vendedor}  onChange={(e) => setVendedor(e.target.value)}>
           
              {vendedores.map(v => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}

            </select>

          </div> 
  
          <button className={styles.limparBtn} onClick={limparFiltros}> <Eraser size={16} strokeWidth={2.5} /> Limpar filtros </button>
        
        </div> 
  
        <div className={styles.tableWrapper}>
          
          <table className={styles.table}>
            <thead>

              <tr>
                <th>Data</th>
                <th>Produto</th>
                <th>Comprador</th>
                <th>Vendedor</th>
                <th>Quantidade</th>
                <th>Total</th>
              </tr>

            </thead>
            <tbody>
              
              {isLoading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center' }}>Carregando...</td></tr>
              ) : vendasExibidas.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center' }}>Nenhuma venda encontrada</td></tr>
              ) : (
                
                vendasExibidas.map((venda) => (
                  
                  <tr key={venda.id}>
                    
                    <td> {(() => {
                      if (!venda.data) return '-';
                      const [ano, mes, dia] = venda.data.split('-');
                      return `${dia}/${mes}/${ano}`;
                    })()}</td>
                   
                    <td className={styles.produtoLink} onClick={() => handleAbrirDetalhes(venda.id)}>
                      
                      {(() => {
                        const itens = venda.itens || [];
                        if (itens.length === 0) return '-';
                        const primeiroProduto = itens[0]?.produto?.nome || itens[0]?.nomeProdutoManual || 'Produto';
                        const qtdItensRestantes = itens.length - 1;
                        return qtdItensRestantes > 0 ? `${primeiroProduto} +${qtdItensRestantes} itens` : primeiroProduto;
                      })()}
                      
                    </td>
                    
                    <td>{venda.clienteFinal ? 'Cliente' : (venda.lojista?.nome || 'Lojista')}</td>
                    <td>{venda.vendedor || '-'}</td>
                    <td>{venda.itens?.reduce((acc, i) => acc + (i.quantidade || 0), 0) || 0}</td>
                    
                    <td className={styles.totalCell}>
                      R$ {venda.valorTotal?.toFixed(2) || '0,00'}
                      <button className={styles.menuCellBtn} onClick={() => handleAbrirDetalhes(venda.id)}> <Ellipsis size={16} strokeWidth={3} color='#02323C'/> </button>
                    </td>
                  
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
  
        <div className={styles.tableFooter}>
        
          <div className={styles.totalLabel}>
            <span>Total:</span>
            <strong>R$ {totalVendas.toFixed(2)}</strong>
          </div>
          
          <div className={styles.pagination}>
            <button className={styles.pageBtn} onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}> <ChevronLeft size={18} strokeWidth={2.5} /> </button>
            <span className={styles.pageInfo}> {page + 1} / {vendas?.totalPages || 1} </span>
            <button className={styles.pageBtn} onClick={() => setPage(page + 1)} disabled={page + 1 >= (vendas?.totalPages || 0)}> <ChevronRight size={18} strokeWidth={2.5} /> </button>
          </div>

        </div>
      </div>      
    </div>
    
    <ModalVendaDetalhes isOpen={modalDetalhesAberto}
    onClose={() => {
      setModalDetalhesAberto(false);
      setVendaSelecionadaId(null);
    }} vendaId={vendaSelecionadaId} addToast={addToast} onSuccess={() => refetch()} />
    
    {showModal && ( <ModalNovaVenda onClose={() => setShowModal(false)} onSuccess={() => refetch()}  addToast={addToast} /> )}
    
  </div>
  );
};

export default Vendas;