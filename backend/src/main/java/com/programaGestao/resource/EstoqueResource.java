package com.programaGestao.resource;

import com.programaGestao.model.Estoque;
import com.programaGestao.model.Produto;
import com.programaGestao.dto.EstoqueDTO;

import jakarta.annotation.security.RolesAllowed;
import jakarta.transaction.Transactional;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Path("/estoque")
@RolesAllowed("user")

@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)

public class EstoqueResource {
    
    @GET

    public Response listar() {
        
        List<EstoqueDTO> dtos = Estoque.listAll().stream().map(e -> {

            Estoque entity = (Estoque) e;
            EstoqueDTO dto = new EstoqueDTO();

            dto.id = entity.id;
            dto.produtoId = entity.produto.id;
            dto.produtoNome = entity.produto.nome;
            dto.produtoFoto = entity.produto.fotoURL;
            dto.produtoPreco = entity.produto.precoVenda;
            dto.quantidade = entity.quantidade;

            return dto;

        }).collect(Collectors.toList());

        return Response.ok(dtos).build();

    }

    @POST
    @Transactional

    public Response criar(EstoqueDTO dto) {

        if (Estoque.find("produto.id", dto.produtoId).firstResult() != null) {
            return Response.status(Response.Status.CONFLICT).entity("Este produto já foi adicionado ao estoque.").build();
        }

        Estoque estoque = new Estoque();
        estoque.produto = Produto.findById(dto.produtoId);
        estoque.quantidade = dto.quantidade;
        
        estoque.persist();
        return Response.status(Response.Status.CREATED).build();

    }

    @PUT
    @Path("/{id}")
    @Transactional

    public void atualizar(@PathParam("id") Long id, EstoqueDTO dto) {
        Estoque entity = Estoque.findById(id);
        entity.quantidade = dto.quantidade;
        entity.dataAtualizacao = LocalDateTime.now();
    }

    @DELETE
    @Path("/{id}")
    @Transactional

    public void excluir(@PathParam("id") Long id) {
        Estoque.deleteById(id);
    }
}
