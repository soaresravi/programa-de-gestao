import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';

import Calendario from '../Calendario/Calendario';
import api from '../../services/api';
import styles from './ModalExportarPDF.module.scss';

const ModalEportarPDF = ({ isOpen, onClose, addToast, tipo, apiUrl }) => {

    const [periodoPreset, setPeriodoPreset] = useState('mes');
    const [dataPersonalizadaInicio, setDataPersonalizadaInicio] = useState('');
    const [dataPersonalizadaFim, setDataPersonalizadaFim] = useState('');
    const [mostrarCalendario, setMostrarCalendario] = useState(false);
    const [loading, setLoading] = useState(false);

    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const primeiroDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    const primeiroDiaAno = new Date(hoje.getFullYear(), 0, 1);
    const trintaDiasAtras = new Date(hoje);

    trintaDiasAtras.setDate(hoje.getDate() - 30);

    const formatarData = (date) => date.toISOString().split('T')[0];

    const ajustarData = (date) => {
        if (!date) return '';
        const ano = date.getFullYear();
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const dia = String(date.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    };

    useEffect(() => {
       
        if (!isOpen) {
            setMostrarCalendario(false);
            setDataPersonalizadaInicio('');
            setDataPersonalizadaFim('');
            setPeriodoPreset('mes');
        }

    }, [isOpen]);

    const handleGerarPDF = async () => {
        
        setLoading(true);

        try {

            let dataInicioFinal = dataPersonalizadaInicio;
            let dataFimFinal = dataPersonalizadaFim;

            if (periodoPreset !== 'personalizado') {
                
                switch (periodoPreset) {
                    
                    case 'mes':
                        dataInicioFinal = formatarData(primeiroDiaMes);
                        dataFimFinal = formatarData(hoje);
                        break;
                   
                    case 'ultimos30':
                        dataInicioFinal = formatarData(trintaDiasAtras);
                        dataFimFinal = formatarData(hoje);
                        break;
                   
                    case 'mesAnterior':
                        dataInicioFinal = formatarData(primeiroDiaMesAnterior);
                        dataFimFinal = formatarData(ultimoDiaMesAnterior);
                        break;
                    
                    case 'ano':
                        dataInicioFinal = formatarData(primeiroDiaAno);
                        dataFimFinal = formatarData(hoje);
                        break;
                   
                    default:
                        break;
                }
            }

            if (!dataInicioFinal || !dataFimFinal) {
                addToast('Selecione um período válido', 'error');
                setLoading(false);
                return;
            }

            const apiEndpoint = apiUrl || '/vendas/exportar-pdf';
            const params = { dataInicio: dataInicioFinal, dataFim: dataFimFinal };

            if (tipo) {
                params.tipo = tipo;
            }

            const response = await api.post(apiEndpoint, null, {
                params: params,
                responseType: 'blob'
            });
            
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            window.open(url, '_blank');

            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);

            addToast('PDF gerado com sucesso!', 'success');
            onClose();

        } catch (error) {

            console.error('Erro ao gerar PDF:', error);
          
            if (error.response && error.response.data instanceof Blob) {
                console.log(await error.response.data.text());
                addToast('Erro interno no servidor', 'error');
            } else {
                addToast('Falha na comunicação com o servidor', 'error');
            }

        } finally {
            setLoading(false);
        }

    };

    if (!isOpen) return null;

    return (
    
    <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            
            <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Exportar para PDF</h2>
                <button className={styles.modalClose} onClick={onClose}> <X size={24} /> </button>
            </div>
            
            <div className={styles.divider} />

            <div className={styles.modalContent}>
                
                <div className={styles.formGroup}>
                    <label>Período:</label>
                    
                    <select value={periodoPreset} onChange={(e) => setPeriodoPreset(e.target.value)} className={styles.selectPeriodo}>
                        <option value="mes">Este mês</option>
                        <option value="ultimos30">Últimos 30 dias</option>
                        <option value="mesAnterior">Mês anterior</option>
                        <option value="ano">Este ano</option>
                        <option value="personalizado">Personalizado</option>
                    </select>

                </div>

                {periodoPreset === 'personalizado' && (
                
                    <div className={styles.calendarioWrapper}>
                        
                        <div className={styles.calendarioTrigger} onClick={() => setMostrarCalendario(!mostrarCalendario)}>
                            
                            <Calendar size={18} strokeWidth={2.5} />
                            <span> {dataPersonalizadaInicio && dataPersonalizadaFim ? `${dataPersonalizadaInicio.split('-').reverse().join('/')} - ${dataPersonalizadaFim.split('-').reverse().join('/')}` : 'Selecione as datas'} </span>
                            
                            {(dataPersonalizadaInicio || dataPersonalizadaFim) && (
                            
                                <X size={14} strokeWidth={2.5}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDataPersonalizadaInicio('');
                                    setDataPersonalizadaFim('');
                                    setMostrarCalendario(false);
                                }} style={{ cursor: 'pointer', marginLeft: '4px' }} />

                            )}
                        
                        </div>
                        
                        {mostrarCalendario && (
                            
                            <div className={styles.calendarioDropdown}>
                                
                                <Calendario dataInicio={dataPersonalizadaInicio} dataFim={dataPersonalizadaFim}
                                onSelect={(inicio, fim) => {
                                    setDataPersonalizadaInicio(ajustarData(inicio));
                                    setDataPersonalizadaFim(ajustarData(fim));
                                }} onClose={() => setMostrarCalendario(false)} />
                            
                            </div>

                        )}

                    </div>
                )}

                <div className={styles.buttonRow}>
                    <button className={styles.cancelarBtn} onClick={onClose}> Cancelar </button>
                    <button className={styles.gerarBtn} onClick={handleGerarPDF} disabled={loading}> {loading ? 'Gerando...' : 'Gerar PDF'} </button>
                </div>
                
            </div>
        </div>
    </div>
    );

};

export default ModalEportarPDF;