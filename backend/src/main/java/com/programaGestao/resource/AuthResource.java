package com.programaGestao.resource;

import com.programaGestao.model.Usuario;

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)

public class AuthResource {
    
    @POST
    @Path("/registro")
    @Transactional

    public Response registrar(@Valid Usuario usuario) {
        
        if (Usuario.find("email", usuario.email).count() > 0) {
            return Response.status(Response.Status.CONFLICT).entity("Email já cadastrado").build();
        }

        usuario.persist();
        return Response.ok(usuario).build();
    }

    @GET 
    @Path("/usuarios")

    public Response listar() {
        return Response.ok(Usuario.listAll()).build();
    }
 }
