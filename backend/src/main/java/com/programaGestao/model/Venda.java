package com.programaGestao.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.programaGestao.enums.Enums.*;
import java.time.LocalDate;
import java.util.List;

@Entity

public class Venda extends PanacheEntity {
    
    public LocalDate data;
    public String vendedor;

    @ManyToOne
    public Lojista lojista;

    @ManyToOne
    public Cidade cidade;

    @Enumerated(EnumType.STRING)
    public OrigemVenda origem;

    public Boolean foiNaLoja;

    @OneToMany(mappedBy = "venda", cascade = CascadeType.ALL)
    @JsonIgnoreProperties({"venda"})
    
    public List<ItemVenda> itens;

    @Enumerated(EnumType.STRING)
    public FormaPagamento formaPagamento;

    public Integer parcelas;
    public Double subtotalProdutos, valorComFrete, valorTotalComJuros, valorDesconto, valorFrete, valorTotal, lucroBruto;

    public Boolean clienteFinal;

}
