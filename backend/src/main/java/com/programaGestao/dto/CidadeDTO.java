package com.programaGestao.dto;

import jakarta.validation.constraints.*;

public class CidadeDTO {

    @NotBlank(message = "Nome da cidade é obrigatório")
    public String nome;

    @PositiveOrZero(message = "Valor do frete deve ser positivo ou zero")
    @NotNull(message = "Valor do frete é obrigatório")
    
    public Double valorFrete;
}
