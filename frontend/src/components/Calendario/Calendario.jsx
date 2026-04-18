import React, { useState, useEffect, useMemo, useCallback} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Calendario.module.scss';

const Calendario = ({ dataInicio, dataFim, onSelect, onClose }) => {

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tempInicio, setTempInicio] = useState(dataInicio ? new Date(dataInicio) : null);
  const [tempFim, setTempFim] = useState(dataFim ? new Date(dataFim) : null);
  const [selecionandoFim, setSelecionandoFim] = useState(false);

  const diasDaSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const getDaysInMonth = useCallback((year, month) => {

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    const prevMonthDays = new Date(year, month, 0).getDate();

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, prevMonthDays - i), isCurrentMonth: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    const remaining = 42 - days.length;

    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;

  }, []);

  const dias = useMemo(() => {
    return getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth, getDaysInMonth]);

  const handleDateClick = (date) => {

    if (!selecionandoFim) {
            
      setTempInicio(date);
      setTempFim(null);
      setSelecionandoFim(true);
        
    } else {

      if (date < tempInicio) {
        setTempInicio(date);
        setTempFim(null);
      } else {
        setTempFim(date);
        onSelect(tempInicio, date);
        setSelecionandoFim(false);
      }

    }
  };

  const isInRange = (date) => {
    if (!tempInicio) return false;
    if (!tempFim) return date.getTime() === tempInicio.getTime();
    return date >= tempInicio && date <= tempFim;
  };

  const isStartDate = (date) => {
    return tempInicio && date.getTime() === tempInicio.getTime();
  };

  const isEndDate = (date) => {
    return tempFim && date.getTime() === tempFim.getTime();
  };

  const mesAnterior = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const proximoMes = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formatarMes = (date => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  });

  return (
  
  <div className={styles.calendarioContainer}>
    
    <div className={styles.calendarioHeader}>
      <button onClick={mesAnterior} className={styles.mesButton}> <ChevronLeft size={20} strokeWidth={2.5} /> </button>
      <span className={styles.mesTitulo}>{formatarMes(currentMonth)}</span>
      <button onClick={proximoMes} className={styles.mesButton}> <ChevronRight size={20} strokeWidth={2.5} /> </button>
    </div>
          
    <div className={styles.diasSemana}>
      
      {diasDaSemana.map(dia => (
        <span key={dia} className={styles.diaSemana}>{dia}</span>
      ))}
    
    </div>
          
    <div className={styles.diasGrid}>
      
      {dias.map(({ date, isCurrentMonth }, index) => {
      
        const isInRangeValue = isInRange(date);
        const isStart = isStartDate(date);
        const isEnd = isEndDate(date);
              
        return (    
          <button key={index} className={`${styles.diaButton} ${!isCurrentMonth ? styles.otherMonth : ''} ${isInRangeValue ? styles.inRange : ''} ${isStart ? styles.startDate : ''} ${isEnd ? styles.endDate : ''}`} onClick={() => handleDateClick(date)}> {date.getDate()} </button>
        );

      })}

    </div>
    
  </div>
  );
};

export default Calendario;