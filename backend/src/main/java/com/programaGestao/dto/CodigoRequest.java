package com.programaGestao.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CodigoRequest {
    
    @NotBlank(message = "email é obrigatório")
    public String email;

    @NotBlank(message = "Código é obrigatório")
    @Size(min = 6, message = "Código deve ter 6 dígitos")

    public String codigo;
    
}
