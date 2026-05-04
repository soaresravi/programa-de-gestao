import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, X } from 'lucide-react';

import ModalExportarPDF from '../../components/ModalExportarPDF/index';
import { useSidebar } from '../../contexts/SidebarContext';
import Sidebar from '../../components/Sidebar';
import Calendario from '../../components/Calendario/Calendario';
import api from '../../services/api';
import Alertas from './components/Alertas';
import CardResumo from './components/CardResumo';
import GraficoBarra from './components/GraficoBarra';
import GraficoBarraHorizontal from './components/GraficoBarraHorizontal';
import GraficoBarraVertical from './components/GraficoBarraVertical';
import GraficoLinha from './components/GraficoLinha';
import GraficoPizza from './components/GraficoPizza';
import TabelaRanking from './components/TabelaRanking';
import styles from './Dashboard.module.scss';

const Dashboard = ({ addToast }) => {
  
  const { isExpanded } = useSidebar();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuario, setUsuario] = useState({ nome: '' });
  const [dataHoje, setDataHoje] = useState('');

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [periodoPreset, setPeriodoPreset] = useState('mes');
  const [dataPersonalizadaInicio, setDataPersonalizadaInicio] = useState('');
  const [dataPersonalizadaFim, setDataPersonalizadaFim] = useState('');
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const calendarioRef = useRef(null);

  useEffect(() => {
    const hoje = new Date();
    setDataHoje(hoje.toLocaleDateString('pt-BR'));
  }, []);

  useEffect(() => {

    const nomeSalvo = localStorage.getItem('usuarioNome');

    if (nomeSalvo && nomeSalvo !== 'Usuário') {
      setUsuario({ nome: nomeSalvo });
    } else {

      const token = localStorage.getItem('token');

      if (token) {

        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUsuario({ nome: payload.nome || payload.upn?.split('@')[0] || 'Usuário' });
        } catch (error) {
          setUsuario({ nome: 'Usuário' });
        }

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
    const trintaDiasAtras = new Date(hoje);
    const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    trintaDiasAtras.setDate(hoje.getDate() - 30);

    const formatarData = (date) => {
      const ano = date.getFullYear();
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const dia = String(date.getDate()).padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    };

    if (periodoPreset !== 'personalizado') {
      
      switch (periodoPreset) {
        
        case 'mes':
          setDataInicio(formatarData(primeiroDiaMes));
          setDataFim(formatarData(ultimoDiaMes));
          break;
        
        case 'ultimos30':
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

  const ajustarData = (date) => {
    if (!date) return '';
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const limparDatasPersonalizadas = () => {
    setDataPersonalizadaInicio('');
    setDataPersonalizadaFim('');
    setPeriodoPreset('mes');
  };

  const { data: resumo } = useQuery({


    queryKey: ['dashboardResumo', dataInicio, dataFim],

    queryFn: async () => {
      const response = await api.get('/dashboard/resumo', { params: { dataInicio, dataFim } });
      return response.data;
    },

    enabled: !!dataInicio && !!dataFim
  
  });

  const { data: gastosCasaLoja } = useQuery({

    queryKey: ['dashboardGastos', dataInicio, dataFim],

    queryFn: async () => {
      const response = await api.get('/dashboard/gastos-casa-vs-loja', { params: { dataInicio, dataFim } });
      return response.data;
    },

    enabled: !!dataInicio && !!dataFim

  });

  const { data: desempenhoProdutos } = useQuery({

    queryKey: ['dashboardDesempenho', dataInicio, dataFim],

    queryFn: async () => {
      const response = await api.get('/dashboard/desempenho-produtos', { params: { dataInicio, dataFim } });
      return response.data;
    },

    enabled: !!dataInicio && !!dataFim

  });

  const { data: rankingClientes } = useQuery({

    queryKey: ['dashboardRankingClientes', dataInicio, dataFim],

    queryFn: async () => {
      const response = await api.get('/dashboard/ranking-clientes', { params: { dataInicio, dataFim } });
      return response.data;
    },

    enabled: !!dataInicio && !!dataFim

  });

  const { data: origemVendas } = useQuery({

    queryKey: ['dashboardOrigem', dataInicio, dataFim],

    queryFn: async () => {
      const response = await api.get('/dashboard/origem-vendas', { params: { dataInicio, dataFim } });
      return response.data;
    },

    enabled: !!dataInicio && !!dataFim

  });

  const { data: relacaoProdutos } = useQuery({
    
    queryKey: ['dashboardRelacaoProdutos', dataInicio, dataFim],
    
    queryFn: async () => {
      const response = await api.get('/dashboard/relacao-produtos', { params: { dataInicio, dataFim } });
      return response.data;
    },

    enabled: !!dataInicio && !!dataFim

  });

  const { data: rankingLojistas } = useQuery({

    queryKey: ['dashboardRankingLojistas', dataInicio, dataFim],

    queryFn: async () => {
      const response = await api.get('/dashboard/ranking-lojistas', { params: { dataInicio, dataFim } });
      return response.data;
    },

    enabled: !!dataInicio && !!dataFim

  });

  const { data: rankingVendedores } = useQuery({
    
    queryKey: ['dashboardRankingVendedores', dataInicio, dataFim],

    queryFn: async () => {
      const response = await api.get('/dashboard/ranking-vendedores', { params: { dataInicio, dataFim } });
      return response.data;
    },

    enabled: !!dataInicio && !!dataFim

  });

  const { data: alertas } = useQuery({

    queryKey: ['dashboardAlertas'],

    queryFn: async () => {
      const response = await api.get('/dashboard/alertas');
      return response.data;
    }

  });

  const { data: evolucao } = useQuery({

    queryKey: ['dashboardEvolucao'],

    queryFn: async () => {
      const response = await api.get('/dashboard/evolucao-mensal');
      return response.data;
    }

  });

  const evolucaoData = evolucao?.historico ? Object.entries(evolucao.historico).map(([mes, dados]) => ({
    mes, receitas: dados.receitas, despesas: dados.despesas
  })) : [];

  const lucroPorTipo = desempenhoProdutos?.lucro ? Object.entries(desempenhoProdutos.lucro).map(([tipo, valor]) => ({
    tipo, lucro: valor
  })) : [];

  const quantidadePorTipo = desempenhoProdutos?.quantidade ? Object.entries(desempenhoProdutos.quantidade).map(([tipo, valor]) => ({
    tipo, quantidade: valor
  })) : [];

  const formatarTipo = (tipo) => {

    const tipos = {
      'BOX_BAU': 'Baú',
      'BASE_BOX': 'Base',
      'CAMA_CONJUGADA': 'Cama',
      'COLCHAO_ESPUMA': 'Colchão Espuma',
      'COLCHAO_MOLA': 'Colchão Mola',
      'BICAMA': 'Bicama',
      'MATERIA_PRIMA': 'Matéria-prima'
    };

    return tipos[tipo] || tipo;

  };

  const totalCamasVendidas = relacaoProdutos?.reduce((acc, item) => acc + (item.quantidade || 0), 0) || 0;

  return (
  
  <div className={styles.container}>
    
    <Sidebar />
      
    <div className={styles.content} style={{ marginLeft: isExpanded ? '250px' : '70px' }}>
        
      <div className={styles.header}>
        <h1 className={styles.title}>Olá, {usuario.nome}! Hoje é dia {dataHoje}</h1>
        <button className={styles.exportBtn} onClick={() => setIsModalOpen(true)}>Exportar para PDF</button>
      </div>
      
      <div className={styles.filtroContainer}>
        <div className={styles.filtroData}>
          
          {periodoPreset !== 'personalizado' ? (
            
            <div className={styles.filtroSelectWrapper}>
              
              <Calendar size={18} strokeWidth={2.5} color='#02323C' style={{ marginLeft: '10px'}} />
              
              <select className={styles.filtroSelect} style={{ padding: '0 0' }}value={periodoPreset} onChange={(e) => setPeriodoPreset(e.target.value)}>
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
                    const inicioFormatado = ajustarData(inicio);
                    const fimFormatado = ajustarData(fim);
                    setDataPersonalizadaInicio(inicioFormatado);
                    setDataPersonalizadaFim(fimFormatado);
                  }} onClose={() => setMostrarCalendario(false)} />
                
                </div>

              )}

            </div>
          )}
        </div>
        
        <div className={styles.totalVendasInfo}>
          <span>Total de vendas no período: <strong>{resumo?.totalVendas || 0}</strong></span>
        </div>
      
      </div>

      <Alertas alertas={alertas} addToast={addToast} />

      <div className={styles.cardsGrid}>
        <CardResumo title="Despesas loja" value={resumo?.despesasLoja || 0} color="#f59e0b" prefix="R$" />
        <CardResumo title="Despesas casa" value={resumo?.despesasCasa || 0} color="#8b5cf6" prefix="R$" />
        <CardResumo title="Custo produção" value={resumo?.totalCustoProducao || 0} color="#ef4444" prefix="R$" />
        <CardResumo title="Receita total" value={resumo?.totalReceitas || 0} color="#10b981" prefix="R$" />
        <CardResumo title="Lucro líquido" value={resumo?.lucroLiquido || 0} color="#22c55e" prefix="R$" />
      </div>

      <div className={styles.chartCardLinha}>
        <h3 className={styles.chartTitle}>Evolução mensal (últimos 12 meses)</h3>
        <GraficoLinha data={evolucaoData} projecao={evolucao?.projecao} />
      </div>
      
      <div className={styles.twoColumns}>
        
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Lucro por tipo de produto</h3>
          <GraficoBarra data={lucroPorTipo.map(item => ({ nome: formatarTipo(item.tipo), valor: item.lucro }))} color="#10b981" label="Lucro (R$)" height={200} />
        </div>
        
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Quantidade vendida por tipo</h3>
          <GraficoBarra data={quantidadePorTipo.map(item => ({ nome: formatarTipo(item.tipo), valor: item.quantidade }))} color="#3b82f6" label="Quantidade" height={200} />
        </div>
      
      </div>
      
      <div className={styles.threeColumnsCompact}>
        
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Origem das vendas</h3>
          <GraficoBarraHorizontal data={origemVendas} />
        </div>
        
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Ranking: Lojistas</h3>
          <GraficoBarraVertical data={rankingLojistas} dataKey="totalGasto" />
        </div>
        
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Gastos: Casa vs Loja</h3>
          <GraficoPizza data={gastosCasaLoja} />
        </div>
      
      </div>
      
      <div className={styles.twoColumnsCompact}>
        
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Lucro: Cliente vs Lojista</h3>
          <GraficoPizza data={rankingClientes} isClienteVsLojista />
        </div>
        
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Ranking: Vendedores</h3>
          <GraficoBarraVertical data={rankingVendedores} dataKey="totalVendido" />
        </div>

      </div>

      <div className={styles.twoColumns}>
        
        <div className={styles.chartCard}>
          
          <h3 className={styles.chartTitle}>Relação de Produtos Vendidos</h3>
          
          <TabelaRanking  data={relacaoProdutos}
          columns={[
            { key: 'nome', label: 'Produto' },
            { key: 'quantidade', label: 'Qtd. Vendida' },
          ]}  />
          
          <div style={{ marginTop: '15px', padding: '10px 0', borderTop: '2px solid #eee', fontSize: '1.1rem',  fontWeight: 'bold', color: '#02323C', textAlign: 'right' }}>
            Total: {totalCamasVendidas} unidades vendidas
          </div>
        
        </div>
      </div>

    </div>
    
    <ModalExportarPDF isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} addToast={addToast} apiUrl="/dashboard/exportar-pdf" dataInicio={dataInicio} dataFim={dataFim} />
  
  </div>
  );

};

export default Dashboard;