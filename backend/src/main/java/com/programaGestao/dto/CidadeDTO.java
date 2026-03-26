package com.programaGestao.dto;

import jakarta.validation.constraints.*;

public class CidadeDTO {

    @NotBlank(message = "Nome da cidade é obrigatório")
    public String nome;

    @NotNull(message = "Valor do frete é obrigatório")
    @Positive(message = "Valor do frete deve ser positivo")

    public Double valorFrete;
}
