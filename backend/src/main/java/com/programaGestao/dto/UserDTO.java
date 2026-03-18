package com.programaGestao.dto;

import jakarta.validation.constraints.*;

public class UserDTO {

    @NotBlank(message = "Nome é obrigatório")
    @Pattern(regexp = "^[A-Za-zÀ-ÖØ-öø-ÿ\\s]+$", message = "Nome deve conter apenas letras")
    
    public String nome;

    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email inválido")
    
    public String email;

    @NotBlank(message = "Senha é obrigatória")
    @Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres")
    public String senha;
    
}
