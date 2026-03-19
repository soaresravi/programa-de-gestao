package com.programaGestao.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RedefinirSenhaRequest {
    
    @NotBlank(message = "Email é obrigatório")
    public String email;

    @NotBlank(message = "Código é obrigatório")
    @Size(min = 6, message = "Código deve ter 6 dígitos")
    
    public String codigo;

    @NotBlank(message = "Nova senha é obrigatória")
    @Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres")

    public String novaSenha;
    
}
