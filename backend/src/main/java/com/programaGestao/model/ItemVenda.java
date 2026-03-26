package com.programaGestao.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

@Entity

public class ItemVenda extends PanacheEntity {
    
    @ManyToOne
    @JsonIgnore
    public Venda venda;

    @ManyToOne
    public Produto produto;

    public Integer quantidade;
    public Double precoUnitario, custoUnitario;

    public String nomeProdutoManual;
    public Boolean modoManual;
}
