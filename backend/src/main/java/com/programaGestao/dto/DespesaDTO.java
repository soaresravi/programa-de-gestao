package com.programaGestao.dto;

import com.programaGestao.enums.Enums.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public class DespesaDTO {
    
    @NotBlank(message = "Nome de despesa é obrigatório")
    public String nome;

    @NotNull(message = "Valor é obrigatório")
    @Positive(message = "Valor deve ser positivo")
    public Double valor;

    public LocalDate dataPagamento, dataVencimento;

    public StatusDespesa status;

    @NotBlank(message = "Tipo é obrigatório (casa ou loja)")
    public String tipo;
}
