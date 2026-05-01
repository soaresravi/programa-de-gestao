import React, { useState, useEffect } from 'react';
import styles from './CardResumo.module.scss';

const CardResumo = ({ title, value, color, prefix = '', maxValue = 100000 }) => {
  
  const [percent, setPercent] = useState(0);
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let rawPercent = (value / maxValue) * 100;
    rawPercent = Math.min(Math.max(rawPercent, 15), 90);
    setPercent(rawPercent);
  }, [value, maxValue]);

  useEffect(() => {
        
    const duration = 1500;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = value / steps;

    let current = 0;

    const timer = setInterval(() => {

      current += increment;

      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }

    }, stepTime);

    return () => clearInterval(timer);

  }, [value]);

  const gradientId = `grad-${title.replace(/\s/g, '')}`;
  
  return (
  
  <div className={styles.card}>
    
    <div className={styles.cardInfo}>
      <span className={styles.cardTitle}>{title}</span>
      <strong className={styles.cardValue}> {prefix} {displayValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} </strong>
    </div>
      
    <div className={styles.liquidWrapper}>
      
      <div className={styles.liquidContainer} style={{ height: `${percent}%` }}>
        
        <svg className={styles.waveSvg} viewBox="0 0 1440 320" preserveAspectRatio="none">
          
          <defs>
            
            <linearGradient id={gradientId} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.8 }} />
              <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.2 }} />
            </linearGradient>
        
          </defs>

          <path fill={`url(#${gradientId})`} className={styles.wavePath} d="M0,160 C320,300,420,0,720,160 C1020,320,1120,0,1440,160 L1440,320 L0,320 Z" />
      
        </svg>

      </div>
      
    </div>
  </div>
  );
};

export default CardResumo;