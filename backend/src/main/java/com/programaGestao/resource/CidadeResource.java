package com.programaGestao.resource;

import com.programaGestao.model.Cidade;
import com.programaGestao.dto.CidadeDTO;

import jakarta.annotation.security.RolesAllowed;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/cidades")
@RolesAllowed("user")

@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)

public class CidadeResource {

    @POST
    @Transactional

    public Response criar(@Valid CidadeDTO dto) {

        Cidade cidade = new Cidade();

        cidade.nome = dto.nome;
        cidade.valorFrete = dto.valorFrete;

        cidade.persist();
        return Response.ok(cidade).build();

    }

    @GET

    public Response listar() {
        List<Cidade> cidades = Cidade.listAll();
        return Response.ok(cidades).build();
    }

    @GET
    @Path("/{id}")

    public Response buscar(@PathParam("id") Long id) {

        Cidade cidade = Cidade.findById(id);

        if (cidade == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        return Response.ok(cidade).build();

    }

    @PUT
    @Path("/{id}")
    @Transactional

    public Response atualizar(@PathParam("id") Long id, @Valid CidadeDTO dto) {
        
        Cidade cidade = Cidade.findById(id);

        if (cidade == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        cidade.nome = dto.nome;
        cidade.valorFrete = dto.valorFrete;

        cidade.persist();
        return Response.ok(cidade).build();

    }

    @DELETE
    @Path("/{id}")
    @Transactional

    public Response deletar(@PathParam("id") Long id) {

        Cidade cidade = Cidade.findById(id);

        if (cidade == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        cidade.delete();
        return Response.noContent().build();
    }
}
