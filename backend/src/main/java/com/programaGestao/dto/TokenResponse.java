package com.programaGestao.dto;

public class TokenResponse {
    
    public String token, refreshToken, tipo = "Bearer";
    public Long id;
    public String nome, email;

    public TokenResponse(String token, String refreshToken, Long id, String nome, String email) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.id = id;
        this.nome = nome;
        this.email = email;
    }
}
