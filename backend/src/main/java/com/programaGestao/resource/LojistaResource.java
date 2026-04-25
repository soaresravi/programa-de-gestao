package com.programaGestao.resource;

import com.programaGestao.model.Lojista;
import com.programaGestao.dto.LojistaDTO;

import jakarta.annotation.security.RolesAllowed;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/lojistas")
@RolesAllowed("user")

@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)

public class LojistaResource {
    
    @POST
    @Transactional

    public Response criar(@Valid LojistaDTO dto) {

        Lojista lojista = new Lojista();
        
        lojista.nome = dto.nome;
        lojista.totalVendas = 0;
        lojista.totalGasto = 0.0;

        lojista.persist();
        return Response.ok(lojista).build();

    }

    @GET

    public Response listar() {
        List<Lojista> lojistas = Lojista.listAll();
        return Response.ok(lojistas).build();
    }

    @GET
    @Path("/{id}")

    public Response buscar(@PathParam("id") Long id) {
        
        Lojista lojista = Lojista.findById(id);

        if (lojista == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        return Response.ok(lojista).build();

    }

    @PUT
    @Path("/{id}")
    @Transactional

    public Response atualizar(@PathParam("id") Long id, @Valid LojistaDTO dto) {

        Lojista lojista = Lojista.findById(id);

        if (lojista == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        lojista.nome = dto.nome;

        lojista.persist();
        return Response.ok(lojista).build();

    }

    @DELETE
    @Path("/{id}")
    @Transactional

    public Response deletar(@PathParam("id") Long id) {

        Lojista lojista = Lojista.findById(id);

        if (lojista == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        lojista.delete();
        return Response.noContent().build();
    }
}
