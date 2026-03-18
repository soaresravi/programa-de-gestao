package com.programaGestao.resource;

import com.programaGestao.dto.UserDTO;
import com.programaGestao.model.Usuario;

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.mindrot.jbcrypt.BCrypt;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)

public class AuthResource {
    
    @POST
    @Path("/registro")
    @Transactional

    public Response registrar(@Valid UserDTO dto) {
        
        if (Usuario.find("email", dto.email).count() > 0) {
            return Response.status(Response.Status.CONFLICT).entity("Email já cadastrado").build();
        }

        Usuario usuario = new Usuario();
        usuario.nome = dto.nome;
        usuario.email = dto.email;

        String hashed = BCrypt.hashpw(dto.senha, BCrypt.gensalt());
        usuario.senha = hashed;

        usuario.persist();
        return Response.ok(usuario).build();
    }

    @GET 
    @Path("/usuarios")

    public Response listar() {
        var usuarios = Usuario.listAll();
        usuarios.forEach(u -> ((Usuario) u).senha = null);
        return Response.ok(usuarios).build();
    }
 }
