package com.programaGestao.security;

import jakarta.ws.rs.core.SecurityContext;
import java.security.Principal;

public class SecurityResource {
    
    public static Long getUsuarioId(SecurityContext ctx) {
        
        Principal principal = ctx.getUserPrincipal();
        
        if (principal != null) {
            
            try {
                return Long.parseLong(principal.getName());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        
        return null;
    }
}