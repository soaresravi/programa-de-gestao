import React, { createContext, useState, useContext } from 'react';

const SidebarContext = createContext();
export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }) => {

  const [isExpanded, setIsExpanded] = useState(true);

  return (

    <SidebarContext.Provider value={{ isExpanded, setIsExpanded }}>
      {children}
    </SidebarContext.Provider>

  );
};