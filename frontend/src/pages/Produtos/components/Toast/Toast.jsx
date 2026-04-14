import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import styles from './Toast.module.scss';

const Toast = ({ message, type = 'success', duration = 5000, onClose }) => {

  const [progress, setProgress] = useState(100);

  useEffect(() => {

    const interval = setInterval(() => {

      setProgress((prev) => {

        if (prev <= 0) {
          clearInterval(interval);
          onClose();
          return 0;
        }

        return prev - (100 / (duration / 100));

      })

    }, 100);

    return () => clearInterval(interval);

  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    info: <Info size={20} />
  };

  return (

  <div className={`${styles.toast} ${styles[type]}`}>

    <div className={styles.content}>   
      <div className={styles.icon}>{icons[type]}</div>
      <div className={styles.message}>{message}</div>
      <button className={styles.closeButton} onClick={onClose}> <X size={16} /> </button>
    </div>
    
    <div className={styles.progressBar} style={{ width: `${progress}%` }} />

  </div>
  );
};

export default Toast;