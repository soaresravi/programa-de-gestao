package com.programaGestao.dto;

import jakarta.validation.constraints.NotBlank;

public class LojistaDTO {
    
    @NotBlank(message = "Nome do lojista é obrigatório")
    public String nome;
    
    public Integer totalVendas;
    public Double totalGasto;
}
