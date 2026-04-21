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
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.SecurityContext;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Path("/vendas")
@RolesAllowed("user")

@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)

public class VendaResource {
    
    @POST
    @Transactional

    public Response criar(@Valid VendaDTO dto) {

        Venda venda = new Venda();

        venda.data = dto.data;
        venda.vendedor = dto.vendedor;
        venda.origem = dto.origem;
        venda.foiNaLoja = dto.foiNaLoja;
        venda.formaPagamento = dto.formaPagamento;
        venda.parcelas = dto.parcelas;
        venda.valorFrete = dto.valorFrete != null ? dto.valorFrete : 0;
        venda.valorDesconto = dto.valorDesconto != null ? dto.valorDesconto : 0;
        venda.clienteFinal = dto.clienteFinal;

        if (dto.cidadeId != null) {

            Cidade cidade = Cidade.findById(dto.cidadeId);

            if (cidade == null) {
                return Response.status(Response.Status.BAD_REQUEST).entity("Cidade não encontrada").build();
            }

            venda.cidade = cidade;
        
        }

        if (dto.lojistaId != null) {

            Lojista lojista = Lojista.findById(dto.lojistaId);

            if (lojista == null) {
                return Response.status(Response.Status.BAD_REQUEST).entity("Lojista não encontrado").build();
            }

            venda.lojista = lojista;

        }

        venda.persist();

        double subtotalProdutos = 0, custoTotal = 0;
        venda.itens = new ArrayList<>();

        for (ItemVendaDTO itemDTO : dto.itens) {

            ItemVenda item = new ItemVenda();
            
            item.venda = venda;
            item.quantidade = itemDTO.quantidade;
            item.modoManual = itemDTO.modoManual != null && itemDTO.modoManual;

            if (item.modoManual) {
       
                item.precoUnitario = itemDTO.precoUnitario;
                item.custoUnitario = itemDTO.custoUnitario != null ? itemDTO.custoUnitario : 0;
       
            } else {

                Produto produto = Produto.findById(itemDTO.produtoId);

                if (produto == null) {
                    return Response.status(Response.Status.BAD_REQUEST).entity("Produto não encontrado: " + itemDTO.produtoId).build();
                }

                item.produto = produto;
                item.precoUnitario = produto.precoVenda;
                item.custoUnitario = produto.custoProducao != null ? produto.custoProducao : 0;
            
            }

            double itemSubtotal = item.quantidade * item.precoUnitario;
            double itemCusto = item.quantidade * item.custoUnitario;

            subtotalProdutos += itemSubtotal;
            custoTotal += itemCusto;

            item.persist();
            venda.itens.add(item);

        }

        double acrescimoParcelas = 0;

        if (venda.formaPagamento == FormaPagamento.CREDITO && venda.parcelas != null && venda.parcelas > 0) {
            acrescimoParcelas = venda.parcelas * 10.0;
        }

        double valorFrete = venda.valorFrete != null ? venda.valorFrete : 0;
        double valorDesconto = venda.valorDesconto != null ? venda.valorDesconto : 0;
        
        venda.subtotalProdutos = subtotalProdutos;
        venda.valorComFrete = subtotalProdutos + valorFrete; 
        venda.valorTotalComJuros = venda.valorComFrete + acrescimoParcelas;
        venda.valorTotal = venda.valorTotalComJuros - valorDesconto;  
        venda.lucroBruto = subtotalProdutos - custoTotal;

        venda.persist();

        if (venda.lojista != null) {
            venda.lojista.totalVendas = (venda.lojista.totalVendas != null ? venda.lojista.totalVendas : 0) + 1;
            venda.lojista.totalGasto = (venda.lojista.totalGasto != null ? venda.lojista.totalGasto : 0) + venda.valorTotal;
            venda.lojista.persist();
        }

        return Response.ok(venda).build();

    }

    @GET

    public Response listar(@QueryParam("dataInicio") LocalDate dataInicio, @QueryParam("dataFim") LocalDate dataFim,
    
    @QueryParam("clienteFinal") Boolean clienteFinal, @QueryParam("tipoProduto") TipoProduto tipoProduto, @QueryParam("vendedor")
    String vendedor, @QueryParam("search") String search, @QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("10") int size) {

        StringBuilder query = new StringBuilder("1=1");
        List<Object> params = new ArrayList<>();

        if (dataInicio != null && dataFim != null) {
            query.append(" and data between ?").append(params.size() + 1);
            query.append(" and ?").append(params.size() + 2);
            params.add(dataInicio);
            params.add(dataFim);
        }

        if (clienteFinal != null) {
            query.append(" and clienteFinal = ?").append(params.size() + 1);
            params.add(clienteFinal);
        }

        if (vendedor != null && !vendedor.trim().isEmpty()) {
            query.append(" and vendedor like ?").append(params.size() + 1);
            params.add("%" + vendedor + "%");
        }

        boolean temFiltroProduto = (tipoProduto != null) || (search != null && !search.trim().isEmpty());

        List<Venda> vendas;
        long totalCount;

        if (temFiltroProduto) {

            StringBuilder hql = new StringBuilder( "select distinct v from Venda v left join v.itens i left join i.produto p where " + query.toString());
            
            if (tipoProduto != null) {
                hql.append(" and p.tipo = ?").append(params.size() + 1);
                params.add(tipoProduto);
            }

            if (search != null && !search.trim().isEmpty()) {
                hql.append(" and (p.nome like ?").append(params.size() + 1).append(")");
                params.add("%" + search + "%");
            }

            hql.append(" order by v.data desc");
            String countHql = hql.toString().replace("select distinct v", "select count(distinct v)");
            totalCount = Venda.count(countHql, params.toArray());
            vendas = Venda.find(hql.toString(), params.toArray()).page(page, size).list();

        } else {

            String hql = "from Venda v where " + query.toString() + " order by v.data desc";
            totalCount = Venda.count(hql, params.toArray());
            vendas = Venda.find(hql, params.toArray()).page(page, size).list();

        }
        
        int totalPages = (int) Math.ceil((double) totalCount / size);
        VendaPaginadaDTO resultado = new VendaPaginadaDTO(vendas, totalCount, totalPages, page);
        return Response.ok(resultado).header("X-Total-Count", totalCount).header("X-Total-Pages", totalPages).build();
    
    }

    @GET
    @Path("/total")

    public Response getTotal(@QueryParam("dataInicio") LocalDate dataInicio, @QueryParam("dataFim") LocalDate dataFim,
    @QueryParam("clienteFinal") Boolean clienteFinal, @QueryParam("tipoProduto") TipoProduto tipoProduto, @QueryParam("vendedor") String vendedor, @QueryParam("search") String search) {

        StringBuilder query = new StringBuilder("select count(v), sum(v.valorTotal), sum(v.lucroBruto) from Venda v ");

        boolean temFiltroProduto = (tipoProduto != null) || (search != null && !search.trim().isEmpty());
        
        if (temFiltroProduto) {
            query.append("left join v.itens i left join i.produto p ");
        }

        query.append("where 1=1 ");
        List<Object> params = new ArrayList<>();

        if (dataInicio != null && dataFim != null) {
            query.append("and v.data between ?").append(params.size() + 1).append(" and ?").append(params.size() + 2).append(" ");
            params.add(dataInicio);
            params.add(dataFim);
        }

        if (clienteFinal != null) {
            query.append("and v.clienteFinal = ?").append(params.size() + 1).append(" ");
            params.add(clienteFinal);
        }

        if (vendedor != null && !vendedor.trim().isEmpty()) {
            query.append("and v.vendedor like ?").append(params.size() + 1).append(" ");
            params.add("%" + vendedor + "%");
        }

        if (tipoProduto != null) {
            query.append("and p.tipo = ?").append(params.size() + 1).append(" ");
            params.add(tipoProduto);
        }

        if (search != null && !search.trim().isEmpty()) {
            query.append("and p.nome like ?").append(params.size() + 1).append(" ");
            params.add("%" + search + "%");
        }

        Object[] result = (Object[]) Venda.find(query.toString(), params.toArray()).project(Object[].class).firstResult();

        if (result == null) {
            return Response.ok(new TotalResponse(0, 0, 0)).build();
        }
    
        long quantidade = (long) (result[0] != null ? result[0] : 0L);
        double receita = (double) (result[1] != null ? result[1] : 0.0);
        double lucro = (double) (result[2] != null ? result[2] : 0.0);
    
        return Response.ok(new TotalResponse(receita, lucro, (int) quantidade)).build();
    }

    @GET
    @Path("/{id}")

    public Response buscar(@PathParam("id") Long id) {

        Venda venda = Venda.findById(id);

        if (venda == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        return Response.ok(venda).build();

    }

    @PUT
    @Path("/{id}")
    @Transactional

    public Response atualizar(@PathParam("id") Long id, @Valid VendaDTO dto, @Context SecurityContext ctx) {

        Venda venda = Venda.findById(id);

        if (venda == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        if (venda.lojista != null) {
            venda.lojista.totalVendas = Math.max(0, venda.lojista.totalVendas - 1);
            venda.lojista.totalGasto = Math.max(0, venda.lojista.totalGasto - venda.valorTotal);
            venda.lojista.persist();
        }

        venda.data = dto.data;
        venda.vendedor = dto.vendedor;
        venda.origem = dto.origem;
        venda.foiNaLoja = dto.foiNaLoja;
        venda.formaPagamento = dto.formaPagamento;
        venda.parcelas = dto.parcelas;
        venda.valorFrete = dto.valorFrete != null ? dto.valorFrete : 0;
        venda.valorDesconto = dto.valorDesconto != null ? dto.valorDesconto : 0;
        venda.clienteFinal = dto.clienteFinal;

        if (dto.cidadeId != null) {
            venda.cidade = Cidade.findById(dto.cidadeId);
        }
        
        if (dto.lojistaId != null) {
            venda.lojista = Lojista.findById(dto.lojistaId);
        } else {
            venda.lojista = null;
        }

        if (venda.itens != null) {
           
            for (ItemVenda item : venda.itens) {
                item.delete();
            }

        }

        double subtotalProdutos = 0;
        double custoTotal = 0;
        
        venda.itens = new ArrayList<>();

        for (ItemVendaDTO itemDTO : dto.itens) {

            ItemVenda item = new ItemVenda();
          
            item.venda = venda;
            item.quantidade = itemDTO.quantidade;
            item.modoManual = itemDTO.modoManual != null && itemDTO.modoManual;

            if (item.modoManual) {
                
                item.precoUnitario = itemDTO.precoUnitario;
                item.custoUnitario = itemDTO.custoUnitario != null ? itemDTO.custoUnitario : 0;
           
            } else {

                Produto produto = Produto.findById(itemDTO.produtoId);

                if (produto == null) {
                    return Response.status(Response.Status.BAD_REQUEST).entity("Produto não encontrado: " + itemDTO.produtoId).build();
                }

                item.produto = produto;
                item.precoUnitario = produto.precoVenda;
                item.custoUnitario = produto.custoProducao != null ? produto.custoProducao : 0;
            
            }

            double itemSubtotal = item.quantidade * item.precoUnitario;
            double itemCusto = item.quantidade * item.custoUnitario;
            subtotalProdutos += itemSubtotal;
            custoTotal += itemCusto;

            item.persist();
            venda.itens.add(item);

        }

        double acrescimoParcelas = (venda.formaPagamento == com.programaGestao.enums.Enums.FormaPagamento.CREDITO && venda.parcelas != null) 
        ? venda.parcelas * 10.0 : 0;
        
        venda.subtotalProdutos = subtotalProdutos;
        venda.valorComFrete = subtotalProdutos + venda.valorFrete;
        venda.valorTotalComJuros = venda.valorComFrete + acrescimoParcelas;
        venda.valorTotal = venda.valorTotalComJuros - venda.valorDesconto;
        venda.lucroBruto = subtotalProdutos - custoTotal;
        
        if (venda.lojista != null) {
            venda.lojista.totalVendas = (venda.lojista.totalVendas != null ? venda.lojista.totalVendas : 0) + 1;
            venda.lojista.totalGasto = (venda.lojista.totalGasto != null ? venda.lojista.totalGasto : 0) + venda.valorTotal;
            venda.lojista.persist();
        }

        venda.persist();
        return Response.ok(venda).build();

    }

    @DELETE
    @Path("/{id}")
    @Transactional

    public Response deletar(@PathParam("id") Long id) {

        Venda venda = Venda.findById(id);

        if (venda == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        if (venda.lojista != null) {
            Lojista lojista = venda.lojista;
            lojista.totalVendas = Math.max(0, (lojista.totalVendas != null ? lojista.totalVendas : 0) - 1);
            lojista.totalGasto = Math.max(0, (lojista.totalGasto != null ? lojista.totalGasto : 0) - venda.valorTotal);
            lojista.persist();
        }

        if (venda.itens != null) {
            
            for (ItemVenda item : venda.itens) {
                item.delete();
            }

        }

        venda.delete();
        return Response.noContent().build();

    }

    @POST
    @Path("/exportar-pdf")
    @Produces("application/pdf")

    public Response exportarPDF(@QueryParam("dataInicio") LocalDate dataInicio, @QueryParam("dataFim") LocalDate dataFim) {

        if (dataInicio == null || dataFim == null) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Data de início e fim são obrigatórias").build();
        }

        List<Venda> vendas = Venda.find("data between ?1 and ?2 order by data desc", dataInicio, dataFim).list();
        String html = gerarHtmlRelatorio(vendas, dataInicio, dataFim);
        return Response.ok(html).type(MediaType.TEXT_HTML).build();

    }

    private String gerarHtmlRelatorio(List<Venda> vendas, LocalDate dataInicio, LocalDate dataFim) {

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        double totalReceita = vendas.stream().mapToDouble(v -> v.valorTotal != null ? v.valorTotal : 0).sum();
        
        double totalCusto = vendas.stream().mapToDouble(v -> { 
            
            double custo = 0;

            if (v.itens != null) {
                custo = v.itens.stream().mapToDouble(i -> i.quantidade * (i.custoUnitario != null ? i.custoUnitario : 0)).sum();
            }

            return custo;

        }).sum();

        double totalLucro = vendas.stream().mapToDouble(v -> v.lucroBruto != null ? v.lucroBruto : 0).sum();
        int totalVendas = vendas.size();

        StringBuilder html = new StringBuilder();

        html.append("<!DOCTYPE html>");
        html.append("<html><head>");
        html.append("<meta charset='UTF-8'>");
        html.append("<style>");
        html.append("body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; background: #f5f5f5; }");
        html.append(".container { max-width: 1400px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }");
        html.append("h1 { color: #14532d; border-left: 5px solid #22c55e; padding-left: 20px; margin-bottom: 10px; }");
        html.append("h2 { color: #166534; font-size: 18px; margin-top: 0; margin-bottom: 20px; }");
        html.append(".header-info { background: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 25px; display: flex; justify-content: space-between; flex-wrap: wrap; }");
        html.append(".header-info p { margin: 5px 0; color: #166534; }");
        html.append(".summary { display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }");
        html.append(".summary-card { background: #f0fdf4; border-radius: 12px; padding: 15px 25px; flex: 1; min-width: 150px; text-align: center; border: 1px solid #bbf7d0; }");
        html.append(".summary-card h3 { margin: 0 0 8px 0; color: #166534; font-size: 14px; font-weight: normal; }");
        html.append(".summary-card .value { font-size: 28px; font-weight: bold; color: #14532d; }");
        html.append("table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }");
        html.append("th { background-color: #14532d; color: white; padding: 12px 8px; text-align: left; font-weight: 600; }");
        html.append("td { border: 1px solid #e5e7eb; padding: 10px 8px; vertical-align: top; }");
        html.append("tr:nth-child(even) { background-color: #f9fafb; }");
        html.append(".footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }");
        html.append(".badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: bold; }");
        html.append(".badge-yes { background: #dcfce7; color: #166534; }");
        html.append(".badge-no { background: #fee2e2; color: #991b1b; }");
        html.append("</style>");
        html.append("</head><body>");
        html.append("<div class='container'>");

        html.append("<h1> PROGRAMA DE GESTÃO - DAVID COLCHÕES </h1>");
        html.append("<h2>Relatório de Vendas</h2>");

        html.append("<div class='header-info'>");
        html.append("<div><strong> Período: </strong>").append(dataInicio.format(fmt)).append(" a ").append(dataFim.format(fmt)).append("</div>");
        html.append("<div> <strong>Gerado em: </strong>").append(LocalDate.now().format(fmt)).append("</div>");

        html.append("<div class='summary'>");
        html.append("<div class='summary-card'> <h3> Total de vendas </h3><div class='value'>").append(totalVendas).append("</div></div>");
        html.append("<div class='summary-card'> <h3> Receita total </h3><div class='value'>R$ ").append(String.format("%,.2f", totalReceita)).append("</div></div>");
        html.append("<div class='summary-card'> <h3> Custo total </h3><div class='value'>R$ ").append(String.format("%,.2f", totalCusto)).append("</div></div>");
        html.append("<div class='summary-card'> <h3> Lucro total </h3><div class='value'>R$ ").append(String.format("%,.2f", totalLucro)).append("</div></div>");
        html.append("</div>");

        html.append("<table>");
        html.append("<thead>");
        html.append("<tr>");
        html.append("<th>ID</th><th>Data</th><th>Produtos</th><th>Cidade</th><th>Qtd</th><th>Valor Unit</th>");
        html.append("<th>Frete</th><th>Descrição</th><th>Forma Pag</th><th>Parcelas</th><th>Total</th>");
        html.append("<th>Loja</th><th>Vendedor</th><th>Comprador</th><th>Nome Loja</th><th>Custo</th><th>Lucro</th>");
        html.append("</tr>");
        html.append("</thead><tbody>");

        for (Venda v : vendas) {

            StringBuilder produtos = new StringBuilder();
            StringBuilder quantidades = new StringBuilder();
            StringBuilder valoresUnitarios = new StringBuilder();

            if (v.itens != null) {

                for (ItemVenda i : v.itens) {

                    String nomeProduto = "";

                    if (i.produto != null) {
                        nomeProduto = i.produto.nome;
                    } else {
                        nomeProduto = "Produto desconhecido";
                    }

                    produtos.append(nomeProduto).append("<br>");
                    quantidades.append(i.quantidade).append("<br>");
                    valoresUnitarios.append("R$ ").append(String.format("%.2f", i.precoUnitario != null ? i.precoUnitario : 0)).append("<br>");

                }
            }

            String foiNaLoja = (v.foiNaLoja != null && v.foiNaLoja) ? "<span class='badge badge-yes'>Sim</span>" : "<span class='badge badge-no'>Não</span>";
            String tipoCliente = (v.clienteFinal != null && v.clienteFinal) ? "Cliente Final" : "Lojista";
            String nomeLojista = (v.lojista != null && v.lojista.nome != null) ? v.lojista.nome : "-";
            String cidadeNome = (v.cidade != null && v.cidade.nome != null) ? v.cidade.nome : "-";
            String parcelasStr = (v.parcelas != null && v.parcelas > 0) ? v.parcelas + "x" : "-";

            html.append("<tr>");
            html.append("<td>").append(v.id).append("</td>");
            html.append("<td>").append(v.data != null ? v.data.format(fmt) : "-").append("</td>");
            html.append("<td>").append(produtos.toString()).append("</td>");
            html.append("<td>").append(cidadeNome).append("</td>");
            html.append("<td>").append(quantidades.toString()).append("</td>");
            html.append("<td>").append(valoresUnitarios.toString()).append("</td>");
            html.append("<td>R$ ").append(String.format("%.2f", v.valorFrete != null ? v.valorFrete : 0)).append("</td>");
            html.append("<td>R$").append(String.format("%.2f", v.valorDesconto != null ? v.valorDesconto : 0)).append("</td>");
            html.append("<td>").append(v.formaPagamento != null ? v.formaPagamento : "-").append("</td>");
            html.append("<td>").append(parcelasStr).append("</td>");
            html.append("<td>R$ ").append(String.format("%.2f", v.valorTotal != null ? v.valorTotal : 0)).append("</td>");
            html.append("<td>").append(foiNaLoja).append("</td>");
            html.append("<td>").append(v.vendedor != null ? v.vendedor : "-").append("</td>");
            html.append("<td>").append(tipoCliente).append("</td>");
            html.append("<td>").append(nomeLojista).append("</td>");

            double custo = 0;

            if (v.itens != null) {
                custo = v.itens.stream().mapToDouble(i -> i.quantidade * (i.custoUnitario != null ? i.custoUnitario : 0)).sum();
            }

            html.append("<td>R$ ").append(String.format("%.2f", custo)).append("</td>");
            html.append("<td>R$ ").append(String.format("%.2f", v.lucroBruto != null ? v.lucroBruto : 0)).append("</td>");
            html.append("</tr>");
        
        }

        html.append("</tbody>");
        html.append("</table>");

        html.append("<div class='footer'>");
        html.append("Programa de Gestão - Desenvolvido por Ravi Soares");
        html.append("</div>");
        html.append("</div>");
        html.append("</body></html>");

        return html.toString();

    } 

    private static class TotalResponse {

        public double totalReceitaBruta, totalLucroBruto;
        public int quantidadeVendas;

        public TotalResponse(double totalReceitaBruta, double totalLucroBruto, int quantidadeVendas) {
            this.totalReceitaBruta = totalReceitaBruta;
            this.totalLucroBruto = totalLucroBruto;
            this.quantidadeVendas = quantidadeVendas;
        }

    }
}
