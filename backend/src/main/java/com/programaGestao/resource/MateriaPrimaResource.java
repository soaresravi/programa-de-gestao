package com.programaGestao.resource;

import com.programaGestao.model.MateriaPrima;
import com.programaGestao.dto.MateriaPrimaDTO;

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.annotation.security.RolesAllowed;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/materias-primas")
@RolesAllowed("user")

@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)

public class MateriaPrimaResource {
    
    @POST
    @Transactional

    public Response criar(@Valid MateriaPrimaDTO dto) {

        MateriaPrima mp = new MateriaPrima();
        
        mp.nome = dto.nome;
        mp.quantidade = dto.quantidade;
        mp.valorUnitario = dto.valorUnitario;

        mp.persist();
        return Response.ok(mp).build();

    }

    @GET

    public Response listar() {
        List<MateriaPrima> materias = MateriaPrima.listAll();
        return Response.ok(materias).build();
    }

    @GET
    @Path("/{id}")

    public Response buscar(@PathParam("id") Long id) {

        MateriaPrima mp = MateriaPrima.findById(id);

        if (mp == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        return Response.ok(mp).build();

    }

    @PUT
    @Path("/{id}")
    @Transactional

    public Response atualizar(@PathParam("id") Long id, @Valid MateriaPrimaDTO dto) {
        
        MateriaPrima mp = MateriaPrima.findById(id);

        if (mp == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        mp.nome = dto.nome;
        mp.quantidade = dto.quantidade;
        mp.valorUnitario = dto.valorUnitario;
        
        mp.persist();
        return Response.ok(mp).build();

    }

    @DELETE
    @Path("/{id}")
    @Transactional

    public Response deletar(@PathParam("id") Long id) {

        MateriaPrima mp = MateriaPrima.findById(id);

        if (mp == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        
        mp.delete();
        return Response.noContent().build();
    }
}
