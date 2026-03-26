package com.programaGestao.resource;

import com.programaGestao.model.MateriaPrima;
import com.programaGestao.model.MateriaPrimaProduto;
import com.programaGestao.model.Produto;
import com.programaGestao.dto.MateriaPrimaProdutoDTO;
import com.programaGestao.dto.ProdutoDTO;

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.annotation.security.RolesAllowed;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.ArrayList;
import java.util.List;

@Path("/produtos")
@RolesAllowed("user")

@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)

public class ProdutoResource {
    
    @POST
    @Transactional

    public Response criar(@Valid ProdutoDTO dto) {

        Produto produto = new Produto();

        produto.nome = dto.nome;
        produto.tipo = dto.tipo;
        produto.modelo = dto.modelo;
        produto.comprimento = dto.comprimento;
        produto.largura = dto.largura;
        produto.altura = dto.altura;
        produto.espessura = dto.espessura;
        produto.acabamento = dto.acabamento;
        produto.especificacao = dto.especificacao;
        produto.precoVenda = dto.precoVenda;
        produto.fotoURL = dto.fotoURL;
        
        produto.persist();

        if (dto.materiasPrimas != null && !dto.materiasPrimas.isEmpty()) {

            double custoTotal = 0;
            produto.materiasPrimas = new ArrayList<>();

            for (MateriaPrimaProdutoDTO mpDTO : dto.materiasPrimas) {

                MateriaPrima materiaPrima = MateriaPrima.findById(mpDTO.materiaPrimaId);

                if (materiaPrima == null) {
                    return Response.status(Response.Status.BAD_REQUEST).entity("Matéria-prima não encontrada: " + mpDTO.materiaPrimaId).build();
                }

                MateriaPrimaProduto mp = new MateriaPrimaProduto();

                mp.produto = produto;
                mp.materiaPrima = materiaPrima;
                mp.quantidade = mpDTO.quantidade;
                mp.valorUnitarioNoMomento = mpDTO.valorUnitarioNoMomento;
                
                mp.persist();
                produto.materiasPrimas.add(mp);

                custoTotal += mp.quantidade * mp.valorUnitarioNoMomento;

            }

            produto.custoProducao = custoTotal;
            produto.persist();

        }

        return Response.ok(produto).build();

    }

    @GET
    
    public Response listar() {
        List<Produto> produtos = Produto.listAll();
        return Response.ok(produtos).build();
    }

    @GET
    @Path("/{id}")

    public Response buscar(@PathParam("id") Long id) {

        Produto produto = Produto.findById(id);

        if (produto == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        return Response.ok(produto).build();

    }

    @PUT
    @Path("/{id}")
    @Transactional

    public Response atualizar(@PathParam("id") Long id, @Valid ProdutoDTO dto) {

        Produto produto = Produto.findById(id);

        if (produto == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        produto.nome = dto.nome;
        produto.tipo = dto.tipo;
        produto.modelo = dto.modelo;
        produto.comprimento = dto.comprimento;
        produto.largura = dto.largura;
        produto.altura = dto.altura;
        produto.espessura = dto.espessura;
        produto.acabamento = dto.acabamento;
        produto.especificacao = dto.especificacao;
        produto.precoVenda = dto.precoVenda;
        produto.fotoURL = dto.fotoURL;

        if (produto.materiasPrimas != null) {
            
            for (MateriaPrimaProduto mp : produto.materiasPrimas) {
                mp.delete();
            }

        }

        if (dto.materiasPrimas != null && !dto.materiasPrimas.isEmpty()) {

            double custoTotal = 0;
            produto.materiasPrimas = new ArrayList<>();

            for (MateriaPrimaProdutoDTO mpDTO : dto.materiasPrimas) {

                MateriaPrima materiaPrima = MateriaPrima.findById(mpDTO.materiaPrimaId);

                if (materiaPrima == null) {
                    return Response.status(Response.Status.BAD_REQUEST).entity("Matéria-prima não encontrada: " + mpDTO.materiaPrimaId).build();
                }

                MateriaPrimaProduto mp = new MateriaPrimaProduto();

                mp.produto = produto;
                mp.materiaPrima = materiaPrima;
                mp.quantidade = mpDTO.quantidade;
                mp.valorUnitarioNoMomento = mpDTO.valorUnitarioNoMomento;

                mp.persist();;
                produto.materiasPrimas.add(mp);
                custoTotal += mp.quantidade * mp.valorUnitarioNoMomento;
            
            }

            produto.custoProducao = custoTotal;

        } else {
            produto.custoProducao = null;
            produto.materiasPrimas = null;
        }

        produto.persist();
        return Response.ok(produto).build();
    
    }

    @DELETE
    @Path("/{id}")
    @Transactional

    public Response deletar(@PathParam("id") Long id) {

        Produto produto = Produto.findById(id);

        if (produto == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        produto.delete();
        return Response.noContent().build();
    }
}
