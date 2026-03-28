package com.programaGestao.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import com.programaGestao.enums.Enums.*;
import java.time.LocalDate;

@Entity

public class Despesa extends PanacheEntity {
    
    public String nome;
    public Double valor;
    public LocalDate dataPagamento;
    public LocalDate dataVencimento;

    @Enumerated(EnumType.STRING)
    public StatusDespesa status;

    public String tipo;
    public Boolean fornecedor;
}
