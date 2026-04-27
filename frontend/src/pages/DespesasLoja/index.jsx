import React from 'react';
import Despesas from '../Despesas/Despesas';

const DespesasLoja = ({ addToast }) => {

    return (
        <Despesas tipo="LOJA" title="Despesas da loja" subtitle="Gerencie todas as despesas da sua loja" addToast={addToast} />
    );

};

export default DespesasLoja;