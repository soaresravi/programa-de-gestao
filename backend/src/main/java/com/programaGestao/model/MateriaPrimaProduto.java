package com.programaGestao.model;

import com.fasterxml.jackson.annotation.JsonBackReference;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

@Entity

public class MateriaPrimaProduto extends PanacheEntity {

    @ManyToOne
    @JsonBackReference
    
    public Produto produto;

    public String nome; 

    public Integer quantidade;
    public Double valorUnitarioNoMomento;
    
}