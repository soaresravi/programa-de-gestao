package com.programaGestao.resource;

import com.programaGestao.model.*;
import com.programaGestao.dto.*;
import com.programaGestao.enums.Enums.*;

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
                
                MateriaPrimaProduto mp = new MateriaPrimaProduto();
                
                mp.produto = produto;
                mp.nome = mpDTO.nome;
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
    
    public Response listar(@QueryParam("tipoProduto") TipoProduto tipoProduto, @QueryParam("modelo") String modelo, @QueryParam("search") String search, @QueryParam("ordenar") @DefaultValue("nome_asc") String ordenar) {      
        
        StringBuilder query = new StringBuilder("1=1");
        List<Object> params = new ArrayList<>();

        if (tipoProduto != null) {
            query.append(" and tipo = ?").append(params.size() + 1);
            params.add(tipoProduto);
        }

        if (modelo != null && !modelo.trim().isEmpty()) {
            query.append(" and modelo = ?").append(params.size() + 1);
            params.add(modelo);
        }

        if (search != null && !search.trim().isEmpty()) {
            query.append(" and nome like ?").append(params.size() + 1);
            params.add("%" + search + "%");
        }

        String hql = "from Produto p where " + query.toString();

        switch (ordenar) {

            case "preco_asc":
                hql += " order by p.precoVenda asc";
                break;
            case "preco_desc":
                hql += " order by p.precoVenda desc";
                break;
            case "nome_desc":
                hql += " order by p.nome desc";
                break;
            case "nome_asc":
            default:
                hql += " order by p.nome asc";
                break;
        }

        List<Produto> produtos = Produto.find(hql, params.toArray()).list();
        return Response.ok(produtos).build();
    }

    @GET
    @Path("/total")

    public Response getTotal(@QueryParam("tipoProduto") TipoProduto tipoProduto, @QueryParam("modelo") String modelo, @QueryParam("search") String search) {

        StringBuilder query = new StringBuilder("1=1");
        List<Object> params = new ArrayList<>();

        if (tipoProduto != null) {
            query.append(" and tipo = ?").append(params.size() + 1);
            params.add(tipoProduto);
        }

        if (modelo != null && !modelo.trim().isEmpty()) {
            query.append(" and modelo = ?").append(params.size() + 1);
            params.add(modelo);
        }

        if (search != null && !search.trim().isEmpty()) {
            query.append(" and nome like ?").append(params.size() + 1);
            params.add("%" + search + "%");
        }

        long total = Produto.count("where " + query.toString(), params.toArray());
        return Response.ok(new TotalResponse(total)).build();

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
                
                MateriaPrimaProduto mp = new MateriaPrimaProduto();
                
                mp.produto = produto;
                mp.nome = mpDTO.nome;
                mp.quantidade = mpDTO.quantidade;
                mp.valorUnitarioNoMomento = mpDTO.valorUnitarioNoMomento;
                
                mp.persist();
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

    private static class TotalResponse {

        public long total;

        public TotalResponse(long total) {
            this.total = total;
        }

    }
}
