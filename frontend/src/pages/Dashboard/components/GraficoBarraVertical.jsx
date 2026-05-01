import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Rectangle } from 'recharts';

const GraficoBarraVertical = ({ data, dataKey = 'valor' }) => {
  
  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];
  
  const formatData = data?.slice(0, 5).map(item => ({
    name: item.nome || item.vendedor, 
    value: item[dataKey] 
  })) || [];

  const renderBarShape = (props) => {
    
    const { index } = props;
    
    return (
      <Rectangle {...props} fill={colors[index % colors.length]} radius={[6, 6, 0, 0]} />
    );

  };

  return (
    
    <ResponsiveContainer width="100%" height={180}>
      
      <BarChart data={formatData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#6b7280' }} interval={0} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(value) => `R$${value}`} />
        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} formatter={(value) => `R$ ${value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />  
        <Bar dataKey="value" barSize={25} shape={renderBarShape}  />
      </BarChart>

    </ResponsiveContainer>
    
  );
};

export default GraficoBarraVertical;