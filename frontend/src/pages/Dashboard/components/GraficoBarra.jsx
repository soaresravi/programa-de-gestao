import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Rectangle } from 'recharts';

const GraficoBarra = ({ data, label = 'Valor' }) => {

  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

  const renderBarShape = (props) => {
    
    const { index } = props;
    
    return (
      <Rectangle {...props} fill={colors[index % colors.length]} radius={[8, 8, 0, 0]}  />
    );

  };

  return (
    
    <ResponsiveContainer width="100%" height={300}>
      
      <BarChart data={data} layout="horizontal" margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#6b7280' }} interval={0} angle={-15} textAnchor="end" />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(value) => label === 'Lucro (R$)' ? `R$ ${value}` : value} />   
        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} formatter={(value) => label === 'Lucro (R$)' ? `R$ ${value?.toFixed(2)}` : value} /> 
        <Bar dataKey="valor" name={label} barSize={32} shape={renderBarShape}  />
      </BarChart>

    </ResponsiveContainer>
    
  );
};

export default GraficoBarra;