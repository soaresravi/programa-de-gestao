import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChartColumn, House, Wallet, BanknoteArrowDown, BedDouble, Store, Truck, Settings, Menu } from 'lucide-react'; 

import { useSidebar } from '../../contexts/SidebarContext';
import styles from './Sidebar.module.scss';

const Sidebar = () => {

  const navigate = useNavigate();
  const location = useLocation();
  const { isExpanded, setIsExpanded } = useSidebar();

  const menuItems = [
    { path: '/', icon: ChartColumn, label: 'Dashboard' },
    { path: '/despesas/casa', icon: House, label: 'Despesas da casa' },
    { path: '/despesas/loja', icon: Wallet, label: 'Despesas da loja' },
    { path: '/vendas', icon: BanknoteArrowDown, label: 'Vendas' },
    { path: '/produtos', icon: BedDouble, label: 'Produtos' },
    { path: '/lojistas', icon: Store, label: 'Lojistas' },
    { path: '/cidades', icon: Truck, label: 'Cidades/frete' },
    { path: '/configuracoes', icon: Settings, label: 'Configurações' },
  ];

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
  
  <div className={`${styles.sidebar} ${!isExpanded ? styles.collapsed : ''}`}>
    
    <div className={styles.logo}>     
      <button className={styles.menuButton} onClick={toggleSidebar}> <Menu size={32} strokeWidth={2.5} /> </button>
      {isExpanded && <span>David Colchões</span>}
    </div>
      
    <nav className={styles.nav}>
      
      {menuItems.map((item) => {
        
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
          
        return (
          
          <button key={item.path} className={`${styles.navItem} ${isActive ? styles.active : ''}`} onClick={() => navigate(item.path)} title={!isExpanded ? item.label : ''}>
            <Icon size={26} strokeWidth={2.5} />
            {isExpanded && <span>{item.label}</span>}
          </button>

        );

      })}

    </nav>
  </div>
  );

};
    
export default Sidebar;