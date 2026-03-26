package com.programaGestao.dto;

import jakarta.validation.constraints.*;

public class ItemVendaDTO {
    
    public Long produtoId;

    @NotNull(message = "Quantidade é obrigatório")
    @Positive(message = "Quantidade deve ser positiva")

    public Integer quantidade;

    public Double precoUnitario, custoUnitario;
    public Boolean modoManual;
}
