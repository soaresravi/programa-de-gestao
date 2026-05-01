import React from 'react';
import { LineChart, Line, XAxis, CartesianGrid, Tooltip, YAxis, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const GraficoLinha = ({ data, projecao = [] }) => {

    const dadosComProjecao = [...data];

    if (projecao && projecao.length > 0) {

        projecao.forEach((valor, idx) => {

            dadosComProjecao.push({
                mes: `Projeção ${idx + 1}`,
                receitas: valor,
                despesas: null,
                isProjecao: true
            });

        });

    }

    return (
        
        <ResponsiveContainer width="100%" height={250}>
          
          <LineChart data={dadosComProjecao}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value) => `R$ ${value?.toFixed(2)}`} />
            <Legend />
            <Line type="monotone" dataKey="receitas" name="Receitas" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="despesas" name="Despesas" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
            <ReferenceLine y={0} stroke="#666" />
          </LineChart>
          
        </ResponsiveContainer>

    );
};

export default GraficoLinha;