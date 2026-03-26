package com.programaGestao.dto;

import com.programaGestao.enums.Enums.*;
import jakarta.validation.constraints.*;
import java.util.List;

public class ProdutoDTO {
    
    @NotBlank(message = "Nome é obrigatório")
    public String nome;

    @NotNull(message = "Tipo é obrigatório")
    public TipoProduto tipo;

    public String modelo;
    public Double comprimento, largura, altura, espessura;
    public Acabamento acabamento;
    public String especificacao;

    @NotNull(message = "Preço de venda é obrigatório")
    @Positive(message = "Preço de venda deve ser positivo")

    public Double precoVenda;
    public Double custoProducao;
    public String fotoURL;

    public List<MateriaPrimaProdutoDTO> materiasPrimas;
}
