package com.programaGestao.model;

import java.time.LocalDateTime;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "estoque_loja")

public class Estoque extends PanacheEntity {
    
    @ManyToOne
    @JoinColumn(name = "produto_id", nullable = false, unique = true)

    public Produto produto;
    public Integer quantidade;

    @Column(name = "data_atualizacao")
    public LocalDateTime dataAtualizacao = LocalDateTime.now();
}
