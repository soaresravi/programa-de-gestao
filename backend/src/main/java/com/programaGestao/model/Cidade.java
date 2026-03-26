package com.programaGestao.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

@Entity

public class Cidade extends PanacheEntity {
    
    public String nome;
    public Double valorFrete;
    
}
