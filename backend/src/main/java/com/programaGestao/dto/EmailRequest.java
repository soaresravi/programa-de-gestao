package com.programaGestao.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class EmailRequest {

    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email inválido")
    public String email;
    
}
