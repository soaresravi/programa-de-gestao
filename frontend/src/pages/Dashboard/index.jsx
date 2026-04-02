import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.scss';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      <h1>Dashboard</h1>
      <p>Bem-vindo ao sistema!</p>
      <button onClick={handleLogout} className={styles.logoutButton}>
        Sair
      </button>
    </div>
  );
};

export default Dashboard;