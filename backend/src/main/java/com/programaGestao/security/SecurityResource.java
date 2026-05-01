package com.programaGestao.security;

import jakarta.ws.rs.core.SecurityContext;
import java.security.Principal;
import org.eclipse.microprofile.jwt.JsonWebToken;

public class SecurityResource {
    
    public static Long getUsuarioId(SecurityContext ctx) {
        
        Principal principal = ctx.getUserPrincipal();
        
        if (principal instanceof JsonWebToken) {
            
            JsonWebToken jwt = (JsonWebToken) principal;
            String subject = jwt.getSubject(); 
           
            try {
                return Long.parseLong(subject);
            } catch (NumberFormatException e) {
                return null;
            }

        }

        return null;
        
    }
}