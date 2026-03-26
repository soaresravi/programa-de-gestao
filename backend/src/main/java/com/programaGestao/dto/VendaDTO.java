package com.programaGestao.dto;

import com.programaGestao.enums.Enums.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

public class VendaDTO {
    
    @NotNull(message = "Data é obrigatória")
    public LocalDate data;

    public String vendedor;
    public Long lojistaId, cidadeId;

    @NotNull(message = "Origem é obrigatória")
    public OrigemVenda origem;

    public Boolean foiNaLoja;

    @NotNull(message = "Itens são obrigatórios")
    public List<ItemVendaDTO> itens;

    @NotNull(message = "Forma de pagamento é obrigatória")
    public FormaPagamento formaPagamento;

    public Integer parcelas;
    public Double valorFrete, valorDesconto;

    @NotNull(message = "Tipo de cliente é obrigatório")
    public Boolean clienteFinal;
}
