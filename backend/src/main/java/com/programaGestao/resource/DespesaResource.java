package com.programaGestao.resource;

import com.programaGestao.model.Despesa;
import com.programaGestao.dto.DespesaDTO;

import jakarta.annotation.security.RolesAllowed;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/despesas")
@RolesAllowed("user")

@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)

public class DespesaResource {
    
    @POST
    @Transactional

    public Response criar(@Valid DespesaDTO dto) {
        
        Despesa despesa = new Despesa();

        despesa.nome = dto.nome;
        despesa.valor = dto.valor;
        despesa.dataVencimento = dto.dataVencimento;
        despesa.dataPagamento = dto.dataPagamento;
        despesa.status = dto.status;
        despesa.tipo = dto.tipo;

        despesa.persist();
        return Response.ok(despesa).build();

    }

    @GET

    public Response listar(@QueryParam("tipo") String tipo) {
        
        if (tipo != null && !tipo.isEmpty()) {
            return Response.ok(Despesa.find("tipo", tipo).list()).build();
        }

        return Response.ok(Despesa.listAll()).build();

    }

    @GET
    @Path("/{id}")

    public Response buscar(@PathParam("id") Long id) {

        Despesa despesa = Despesa.findById(id);

        if (despesa == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        return Response.ok(despesa).build();

    }

    @PUT
    @Path("/{id}")
    @Transactional

    public Response atualizar(@PathParam("id") Long id, @Valid DespesaDTO dto) {

        Despesa despesa = Despesa.findById(id);

        if (despesa == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        return Response.ok(despesa).build();

    }

    @DELETE
    @Path("/{id}")
    @Transactional

    public Response deletar(@PathParam("id") Long id) {

        Despesa despesa = Despesa.findById(id);

        if (despesa == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        despesa.delete();
        return Response.noContent().build();
        
    }
}
