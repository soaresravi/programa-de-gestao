package com.programaGestao.dto;

import jakarta.validation.constraints.Email;

public class AtualizarPerfilDTO {
    
    public String nome;

    @Email(message = "Email inválido")
    public String email;

    public String senhaAtual;
    public String novaSenha;
    
}
