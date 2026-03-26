package com.programaGestao.enums;

public class Enums {
    
    public enum TipoProduto {
        BOX_BAU, BASE_BOX, CAMA_CONJUGADA, COLCHAO_ESPUMA, COLCHAO_MOLA, BICAMA
    }

    public enum ModeloBauBaseColchao {
        SOLTEIRO, SOLTEIRAO, CASAL, VIUVO, CASAL_BIPARTIDO, QUEEN, KING
    }

    public enum ModeloCama {
        SOLTEIRO, CASAL
    }

    public enum ModeloBicama {
        SOLTEIRO
    }

    public enum Acabamento {
        SUEDE, CORINO, MALHA, TSM, POLIESTER
    }

    public enum EspecificacaoCama {
        CINCO_CM, DEZ_CM, QUINZE_CM, MOLA_POLIESTER, MOLA_MALHA
    }

    public enum EspecificacaoColchaoEspuma {
        D23, D28, D33, D45
    }

    public enum EspecificacaoColchaoMola {
        SPLENDIDA, HAVANA
    }

    public enum EspecificacaoBicama {
        CINCO_CM, DEZ_CM, DOIS_POR_UM, TRES_POR_UM_BAU_DEZ_CM, TRES_POR_UM_BAU_DUAS_10_CM
    }

    public enum FormaPagamento {
        PIX, DINHEIRO, DEBITO, CREDITO
    }

    public enum OrigemVenda {
        LOJA_FISICA, WHATSAPP
    }

    public enum StatusDespesa {
        PAGO, PENDENTE, ATRASADO
    }
}
