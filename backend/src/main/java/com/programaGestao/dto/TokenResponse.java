package com.programaGestao.dto;

public class TokenResponse {
    
    public String token, tipo = "Bearer";
    public Long id;
    public String nome, email;

    public TokenResponse(String token, Long id, String nome, String email) {
        this.token = token;
        this.id = id;
        this.nome = nome;
        this.email = email;
    }
}
