package com.programaGestao.dto;

import jakarta.validation.constraints.*;

public class MateriaPrimaProdutoDTO {

    @NotBlank(message = "O nome da matéria-prima é obrigatório")
    public String nome;

    @NotNull(message = "Quantidade é obrigatória")
    @Positive(message = "Quantidade deve ser positiva")
   
    public Integer quantidade;

    @NotNull(message = "Valor unitário é obrigatório")
    @Positive(message = "Valor unitário deve ser positivo")
    
    public Double valorUnitarioNoMomento;

}
