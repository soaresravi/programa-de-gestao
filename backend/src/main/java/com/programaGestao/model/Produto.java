package com.programaGestao.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.programaGestao.enums.Enums.*;
import java.util.List;

@Entity
@JsonIgnoreProperties({"materiasPrimas"})

public class Produto extends PanacheEntity {
    
    public String nome;

    @Enumerated(EnumType.STRING)
    public TipoProduto tipo;
    
    public String modelo;
    public Double comprimento, largura, altura, espessura;

    @Enumerated(EnumType.STRING)
    public Acabamento acabamento;

    public String especificacao;
    public Double precoVenda, custoProducao;

    @OneToMany(mappedBy = "produto", cascade = CascadeType.ALL)
    public List<MateriaPrimaProduto> materiasPrimas;

    public String fotoURL;
}
