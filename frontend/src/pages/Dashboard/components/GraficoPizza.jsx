import React from 'react';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const GraficoPizza = ({ data, isClienteVsLojista }) => {
    
    let chartData = [];

    if (isClienteVsLojista && data) {
       
        chartData = [
            { name: 'Cliente', value: data.clienteFinal || 0, fill: '#8b5cf6' },
            { name: 'Lojista', value: data.lojista || 0, fill: '#10b981' }
        ];

    } else if (data) {
        
        chartData = [
            { name: 'Casa', value: data.casa || 0, fill: '#8b5cf6' },
            { name: 'Loja', value: data.loja || 0, fill: '#10b981'}
        ];

    }

    const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent }) => {
        
        const RADIAN = Math.PI / 180;
        const radius = outerRadius * 0.7; 
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" style={{ fontSize: '12px', fontWeight: 'bold', pointerEvents: 'none' }}> {`${(percent * 100).toFixed(0)}%`} </text>
        );

    };

    return (
        
        <ResponsiveContainer width="100%" height={180}>
            
            <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} outerRadius={60} dataKey="value" stroke="none" />
                <Tooltip formatter={(value) => `R$ ${value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} contentStyle={{ borderRadius: '8px', fontSize: '13px', border: 'none' }} />
                <Legend verticalAlign="bottom" align="center" iconSize={8} wrapperStyle={{ fontSize: '14px', paddingTop: '5px' }} />
            </PieChart>

        </ResponsiveContainer>
        
    );
};

export default GraficoPizza;