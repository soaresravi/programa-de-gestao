import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useSidebar } from '../../contexts/SidebarContext';
import Sidebar from '../../components/Sidebar';
import styles from './Dashboard.module.scss';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isExpanded } = useSidebar();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.content} style={{ marginLeft: isExpanded ? '260px' : '80px' }}>
        <h1>Dashboard</h1>
        <p>Bem-vindo ao sistema!</p>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Sair
        </button>
      </div>
    </div>
  );
};

export default Dashboard;