package com.programaGestao.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Random;

@Entity
@Table(name = "recuperacao_senha")

public class RecuperacaoSenha extends PanacheEntity {
    
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)

    public Usuario usuario;

    @Column(nullable = false, length = 6)
    public String codigo;

    @Column(nullable = false)
    public LocalDateTime expiracao;

    public boolean utilizado;

    public static String gerarCodigo() {
        Random random = new Random();
        int numero = 100000 + random.nextInt(900000);
        return String.valueOf(numero);
    }

    public boolean isValido() {
        return !utilizado && LocalDateTime.now().isBefore(expiracao);
    }
    
}
