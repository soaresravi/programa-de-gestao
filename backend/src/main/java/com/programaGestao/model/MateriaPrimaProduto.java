package com.programaGestao.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

@Entity

public class MateriaPrimaProduto extends PanacheEntity {

    @ManyToOne
    @JsonIgnore
    public Produto produto;

    @ManyToOne
    public MateriaPrima materiaPrima;

    public Integer quantidade;
    public Double valorUnitarioNoMomento;
    
}