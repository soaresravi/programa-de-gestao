package com.programaGestao.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

@Entity

public class Lojista extends PanacheEntity {

    public String nome;
    public Integer totalVendas;
    public Double totalGasto;
    
}
