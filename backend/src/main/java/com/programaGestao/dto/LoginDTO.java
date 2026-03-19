package com.programaGestao.dto;

import jakarta.validation.constraints.*;

public class LoginDTO {
    
    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email inválido")

    public String email;

    @NotBlank(message = "Senha é obrigatório")
    @Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres")

    public String senha;
    
}
