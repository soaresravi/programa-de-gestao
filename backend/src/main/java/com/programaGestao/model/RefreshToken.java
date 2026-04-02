package com.programaGestao.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Entity;
import java.time.LocalDateTime;

@Entity

public class RefreshToken extends PanacheEntity {
    public String token;
    public Long usuarioId;
    public LocalDateTime expiracao;
    public Boolean usado;
}
