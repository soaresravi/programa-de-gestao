import React from 'react';
import Toast from './Toast';

const ToastContainer = ({ toasts, onClose }) => {
  
  return (
  
  <div style={{ position: 'fixed', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: '1100'}}>
    {toasts.map((toast) => (
      <Toast key={toast.id} message={toast.message} type={toast.type} duration={toast.duration} onClose={() => onClose(toast.id)} />
    ))}
  </div>
    
  );
};

export default ToastContainer;