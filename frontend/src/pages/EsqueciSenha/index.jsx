import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import EtapaEmail from './EtapaEmail';
import EtapaCodigo from './EtapaCodigo';
import EtapaNovaSenha from './EtapaNovaSenha';
import styles from './EsqueciSenha.module.scss';

const EsqueciSenha = ({ showError, showSuccess }) => {

    const [etapa, setEtapa] = useState(1);
    const [email, setEmail] = useState('');
    const [codigo, setCodigo] = useState('');

    const avancar = () => setEtapa(etapa + 1);
    const voltar = () => setEtapa(etapa - 1);

    return (
        
        <div className={styles.container}>
            <div className={styles.card}>

                <AnimatePresence mode="wait">
                    
                    {etapa === 1 && (
                        
                        <motion.div key="email" initial={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} transition={{ duration: 0.3 }}>
                            <EtapaEmail email={email} setEmail={setEmail} avancar={avancar} showError={showError} />
                        </motion.div>

                    )}

                    {etapa === 2 && (
                        
                        <motion.div key="codigo" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} transition={{ duration: 0.3 }}>
                            <EtapaCodigo email={email} codigo={codigo} setCodigo={setCodigo} avancar={avancar} voltar={voltar} showError={showError} showSuccess={showSuccess} />
                        </motion.div>

                    )}

                    {etapa === 3 && (

                        <motion.div key="novaSenha" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
                            <EtapaNovaSenha email={email} codigo={codigo} voltar={voltar} showError={showError} />
                        </motion.div>

                    )}

                </AnimatePresence>
            </div>
        </div>
    );
};

export default EsqueciSenha;