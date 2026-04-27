import React, { useState, useEffect, useRef } from 'react';
import { Search, Calendar, Eraser, Plus, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { useSidebar } from '../../contexts/SidebarContext';
import Sidebar from '../../components/Sidebar';
import Calendario from '../../components/Calendario/Calendario';
import ModalNovaDespesa from './components/ModalNovaDespesa';
import ModalExportarPDF from '../../components/ModalExportarPDF';
import ModalDetalhesDespesa from './components/ModalDetalhesDespesa';
import api from '../../services/api';
import styles from './Despesas.module.scss';

const Despesas = ({ tipo, subtitle, addToast }) => {

  const {isExpanded } = useSidebar();
  const [usuario, setUsuario] = useState({ nome: '' });
    
  const [search, setSearch] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [periodoPreset, setPeriodoPreset] = useState('mes');
  const [dataPersonalizadaInicio, setDataPersonalizadaInicio] = useState('');
  const [dataPersonalizadaFim, setDataPersonalizadaFim] = useState('');
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [apenasFornecedor, setApenasFornecedor] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [despesaSelecionadaId, setDespesaSelecionadaId] = useState(null);
  const [modalExportarAberto, setModalExportarAberto] = useState(false);

  const calendarioRef = useRef(null);

  useEffect(() => {
    
    const buscarNomeUsuario = async () => {
      
      try {
        const response = await api.get('/auth/me');
        setUsuario({ nome: response.data.nome });
      } catch (error) {
        console.error("Erro ao buscar nome:", error);
        setUsuario({ nome: 'Usuário' });
      }

    };
      
    buscarNomeUsuario();
  
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
      
    const formatarDataParaAPI = (date) => {
      const ano = date.getFullYear();
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const dia = String(date.getDate()).padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    };
    
    if (periodoPreset !== 'personalizado') {
      
      switch (periodoPreset) {
        
        case 'mes':
          
          setDataInicio(formatarDataParaAPI(primeiroDiaMes));
          setDataFim(formatarDataParaAPI(hoje));
          break;
      
        case 'ultimos30':
          
          const trintaDiasAtras = new Date(hoje);
          trintaDiasAtras.setDate(hoje.getDate() - 30);
          setDataInicio(formatarDataParaAPI(trintaDiasAtras));
          setDataFim(formatarDataParaAPI(hoje));
          break;
        
        case 'mesAnterior':
            
          setDataInicio(formatarDataParaAPI(primeiroDiaMesAnterior));
          setDataFim(formatarDataParaAPI(ultimoDiaMesAnterior));
          break;
        
        case 'ano':
          
          setDataInicio(formatarDataParaAPI(primeiroDiaAno));
          setDataFim(formatarDataParaAPI(hoje));
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

  const { data: despesas, refetch, isLoading } = useQuery({

    queryKey: ['despesas', tipo, page, pageSize, dataInicio, dataFim, search, apenasFornecedor],

    queryFn: async () => {
           
      const params = new URLSearchParams();
      params.append('tipo', tipo);
           
      if (dataInicio) params.append('dataInicio', dataInicio);
      if (dataFim) params.append('dataFim', dataFim);
      if (search) params.append('search', search);
      if (apenasFornecedor && tipo === 'LOJA') params.append('apenasFornecedor', apenasFornecedor);
           
      params.append('page', page);
      params.append('size', pageSize);

      const response = await api.get(`/despesas?${params.toString()}`);
      setTotalPages(parseInt(response.headers['x-total-pages']) || 1);
      return response.data;

    },

  });

  const totalDespesas = despesas?.reduce((acc, d) => acc + (d.valor || 0), 0) || 0;

  const limparFiltros = () => {
    setPeriodoPreset('mes');
    setSearch('');
    setPage(0);
    setDataPersonalizadaInicio('');
    setDataPersonalizadaFim('');
    setApenasFornecedor(false);
  };

  const limparDatasPersonalizadas = () => {
    setDataPersonalizadaInicio('');
    setDataPersonalizadaFim('');
    setPeriodoPreset('mes');
  };

  const formatarStatus = (status) => {
        
    const statusMap = {
      'PAGO': 'Pago',
      'PENDENTE': 'Pendente',
      'ATRASADO': 'Atrasado'
    };

    return statusMap[status] || status;

  };

  const getStatusClass = (status) => {
    return `${styles.statusBadge} ${styles[status] || ''}`;
  };
  
  const formatarData = (dataString) => {
    if (!dataString) return '-';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
  
  <div className={styles.container}>
    
    <Sidebar />
    
    <div className={styles.content} style={{ marginLeft: isExpanded ? '250px' : '70px' }}>
      
      <div className={styles.header}>
        
        <div>
          <h1 className={styles.title}>Olá, {usuario.nome}!</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        
        <div className={styles.headerButtons}>
          <button className={styles.exportBtn} onClick={() => setModalExportarAberto(true)}>Exportar para PDF</button>
          <button className={styles.novaDespesaBtn} onClick={() => setShowModal(true)}> <Plus size={20} strokeWidth={3.5} /> Nova despesa </button>
        </div>

      </div>
    
      <div className={styles.tabelaContainer}>
        
        <div className={styles.tabelaHeader}>
          
          <h2 className={styles.tabelaTitle}>Despesas</h2>
          
          <div className={styles.searchBox}>
            <Search size={18} strokeWidth={2.5} />
            <input type="text" placeholder="Pesquisar despesas..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        
        </div>
    
        <div className={styles.filtros}>
          <div className={styles.filtrosEsquerda}>
            
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
                  <span> {dataPersonalizadaInicio && dataPersonalizadaFim ? `${dataPersonalizadaInicio.split('-').reverse().join('/')} - ${dataPersonalizadaFim.split('-').reverse().join('/')}` : 'Selecione as datas'} </span>
                  
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
            
            {tipo === 'LOJA' && (
              
              <div className={styles.filtroFornecedor}>
                <input type="checkbox" id="fornecedor" checked={apenasFornecedor} onChange={(e) => setApenasFornecedor(e.target.checked)} />
                <label htmlFor="fornecedor">Apenas fornecedores</label>
              </div>

            )}

          </div>
          
          <button className={styles.limparBtn} onClick={limparFiltros}> <Eraser size={16} strokeWidth={2.5} /> Limpar filtros </button>
        
        </div>
    
        <div className={styles.tableWrapper}>  
          <table className={styles.table}>
            
            <thead>
              
              <tr>
                <th>Nome</th>
                <th>Valor</th>
                <th>Data de pagamento</th>
                <th>Data de vencimento</th>
                <th>Status</th>
              </tr>

            </thead>
            <tbody>
              
              {isLoading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center' }}>Carregando...</td></tr>
              ) : despesas?.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center' }}>Nenhuma despesa encontrada</td></tr>
              ) : (
                
                despesas?.map((despesa) => (
                  
                  <tr key={despesa.id} onClick={() => {
                    setDespesaSelecionadaId(despesa.id);
                    setModalDetalhesAberto(true);
                  }}>
                    
                    <td>{despesa.nome || '-'}</td>
                    <td>R$ {(despesa.valor || 0).toFixed(2)}</td>
                    <td>{formatarData(despesa.dataPagamento)}</td>
                    <td>{formatarData(despesa.dataVencimento)}</td>
                    <td><span className={getStatusClass(despesa.status)}>{formatarStatus(despesa.status)}</span></td>
                  
                  </tr>

                ))

              )}

            </tbody>
          </table>
        </div>
    
        <div className={styles.tableFooter}>
          
          <div className={styles.totalLabel}>
            <span>Total:</span>
            <strong>R$ {totalDespesas.toFixed(2)}</strong>
          </div>
          
          <div className={styles.pagination}>
            <button className={styles.pageBtn} onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}> <ChevronLeft size={18} strokeWidth={2.5} /> </button>
            <span className={styles.pageInfo}>{page + 1} / {totalPages}</span>
            <button className={styles.pageBtn} onClick={() => setPage(page + 1)} disabled={page + 1 >= totalPages}> <ChevronRight size={18} strokeWidth={2.5} /> </button>
          </div>

        </div>
        
      </div>
    </div>

    <ModalExportarPDF isOpen={modalExportarAberto} onClose={() => setModalExportarAberto(false)} addToast={addToast} tipo={tipo} apiUrl="/despesas/exportar-pdf" />
    <ModalNovaDespesa isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={() => refetch()} addToast={addToast} tipo={tipo} />
    
    <ModalDetalhesDespesa isOpen={modalDetalhesAberto}
    
    onClose={() => {
      setModalDetalhesAberto(false);
      setDespesaSelecionadaId(null);
    }} despesaId={despesaSelecionadaId} addToast={addToast} onSuccess={() => refetch()} />

  </div>
  );
};

export default Despesas;