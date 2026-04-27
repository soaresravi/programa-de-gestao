import React from 'react';
import Despesas from '../Despesas/Despesas';

const DespesasCasa = ({ addToast }) => {

    return (
        <Despesas tipo="CASA" title="Despesas da casa" subtitle="Gerencie todas as despesas residenciais" addToast={addToast} />
    );

};

export default DespesasCasa;