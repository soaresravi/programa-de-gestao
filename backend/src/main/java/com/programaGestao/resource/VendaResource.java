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

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import org.xhtmlrenderer.pdf.ITextRenderer;

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

                if (itemDTO.produtoId != null) {
                    
                    Produto produto = Produto.findById(itemDTO.produtoId);
                    
                    if (produto != null) {
                        item.produto = produto;
                    }

                }
       
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

                if (itemDTO.produtoId != null) {
                   
                    Produto produto = Produto.findById(itemDTO.produtoId);
                   
                    if (produto != null) {
                        item.produto = produto;
                    }
                    
                }
           
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
   
    public Response exportarPDF( @QueryParam("dataInicio") String dataInicioStr, @QueryParam("dataFim") String dataFimStr) {
    
        try {

            if (dataInicioStr == null || dataFimStr == null || dataInicioStr.isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST).entity("Datas inválidas").build();
            }

            LocalDate dataInicio = LocalDate.parse(dataInicioStr);
            LocalDate dataFim = LocalDate.parse(dataFimStr);

            List<Venda> vendas = Venda.find("data between ?1 and ?2 order by data desc", dataInicio, dataFim).list();
            String html = gerarHtmlRelatorio(vendas, dataInicio, dataFim);

            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
            ITextRenderer renderer = new ITextRenderer();

            renderer.setDocumentFromString(html);
            renderer.layout();
            renderer.createPDF(byteArrayOutputStream);
            
            byte[] pdfBytes = byteArrayOutputStream.toByteArray();
            
            return Response.ok(pdfBytes).type("application/pdf").header("Content-Disposition", "attachment; filename=relatorio_vendas.pdf").build();
            
        } catch (DateTimeParseException e) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Formato de data inválido. Use YYYY-MM-DD").build();
        }

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
        html.append("<meta charset='UTF-8' />");
        
        html.append("<style>");
        html.append("@page { size: portrait; margin: 0.8cm; }");
        html.append("body { font-family: Helvetica, Times New Roman; font-size: 10px; color: #333; margin: 0; }");
        html.append(".container { width: 100%; }");
    
        html.append("h1 { color: #000000; font-weight: bold; font-size: 16px; margin: 0 0 5px 0; }");
        html.append("h2 { color: #166534; font-size: 13px; margin: 0 0 10px 0; }");
        
        html.append(".header-info { width: 100%; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px; display: flex; justify-content: space-between; }");
        
        html.append(".summary-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }");
        html.append(".summary-card { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 6px; text-align: center; }");
        html.append(".summary-card h3 { margin: 0; font-size: 10px; color: #166534; text-transform: uppercase; }");
        html.append(".summary-card .value { font-size: 14px; font-weight: bold; color: #14532d; }");
    
        html.append("table { width: 100%; border-collapse: collapse; font-size: 9px; }");
        html.append("th { background-color: #14532d; color: white; padding: 5px 3px; text-align: left; }");
        html.append("td { border: 1px solid #e5e7eb; padding: 4px 3px; vertical-align: top; }");
        html.append("tr:nth-child(even) { background-color: #f9fafb; }");
        
        html.append(".badge { padding: 1px 4px; border-radius: 4px; font-size: 8px; font-weight: bold; display: inline-block; }");
        html.append(".badge-yes { background: #dcfce7; color: #166534; }");
        html.append(".badge-no { background: #fee2e2; color: #991b1b; }");
        
        html.append(".footer { margin-top: 20px; text-align: center; font-size: 8px; color: #6b7280; }");
        
        html.append(".col-pequena { width: 35px; text-align: center; }");
        html.append(".col-valor { width: 60px; text-align: right; }");
        html.append(".col-produto { width: 130px; }");
        html.append("td.col-pequena { text-align: center; }");
        html.append("td.col-valor { text-align: right; }");
        
        html.append("</style>");
        html.append("</head><body>");
        html.append("<div class='container'>");
    
        html.append("<h1> Programa de gestão - David Colchões </h1>");
        html.append("<h2>Relatório de vendas</h2>");
    
        html.append("<div class='header-info'>");
        html.append("<div><strong>Período:</strong> ").append(dataInicio.format(fmt)).append(" a ").append(dataFim.format(fmt)).append("</div>");
        html.append("<div><strong>Gerado em:</strong> ").append(LocalDate.now().format(fmt)).append("</div>");
        html.append("</div>");
        
        html.append("<table class='summary-table'>");
        html.append("<tr>");
        html.append("<td class='summary-card' width='25%'><h3>Vendas</h3><div class='value'>").append(totalVendas).append("</div></td>");
        html.append("<td class='summary-card' width='25%'><h3>Receita</h3><div class='value'>R$ ").append(String.format("%,.2f", totalReceita)).append("</div></td>");
        html.append("<td class='summary-card' width='25%'><h3>Custo</h3><div class='value'>R$ ").append(String.format("%,.2f", totalCusto)).append("</div></td>");
        html.append("<td class='summary-card' width='25%'><h3>Lucro</h3><div class='value'>R$ ").append(String.format("%,.2f", totalLucro)).append("</div></td>");
        html.append("</tr>");
        html.append("</table>");
    
        html.append("<table>"); 
        html.append("<thead>");
        html.append("<tr>");
        html.append("<th>Data</th>");
        html.append("<th class='col-produto'>Produto</th>");
        html.append("<th>Cidade</th>");
        html.append("<th class='col-pequena'>Qtd</th>");
        html.append("<th class='col-valor'>R$/Un</th>");
        html.append("<th class='col-valor'>Frete</th>");
        html.append("<th class='col-valor'>Desc</th>");
        html.append("<th>Forma Pag</th>");
        html.append("<th class='col-pequena'>Parc</th>");
        html.append("<th>Loja</th>");
        html.append("<th>Vendedor</th>");
        html.append("<th>Comprador</th>");
        html.append("<th>Lojista</th>");
        html.append("<th class='col-valor'>Total</th>");
        html.append("<th class='col-valor'>Custo</th>");
        html.append("<th class='col-valor'>Lucro</th>");
        html.append("</tr>");
        html.append("</thead><tbody>");
    
        for (Venda v : vendas) {

            String cidadeNome = (v.cidade != null && v.cidade.nome != null) ? v.cidade.nome : "-";
            String foiNaLoja = (v.foiNaLoja != null && v.foiNaLoja) ? "<span class='badge badge-yes'>Sim</span>" : "<span class='badge badge-no'>Não</span>";
            String tipoCliente = (v.clienteFinal != null && v.clienteFinal) ? "Cliente" : "Lojista";
            String nomeLojista = (v.lojista != null && v.lojista.nome != null) ? v.lojista.nome : "-";
            String parcelasStr = (v.parcelas != null && v.parcelas > 0) ? v.parcelas + "x" : "-";
            String formaPagamento = v.formaPagamento != null ? v.formaPagamento.toString() : "-";

            double custoTotalVenda = 0;
        
            if (v.itens != null) {
                custoTotalVenda = v.itens.stream().mapToDouble(i -> i.quantidade * (i.custoUnitario != null ? i.custoUnitario : 0)).sum();
            }
        
            if (v.itens != null && !v.itens.isEmpty()) {
                
                boolean primeiroItem = true;
                
                for (ItemVenda item : v.itens) {
                    
                    String nomeProduto = item.produto != null ? item.produto.nome : "Produto";
                    int quantidade = item.quantidade != null ? item.quantidade : 0;
                    double precoUnitario = item.precoUnitario != null ? item.precoUnitario : 0;
                    
                    html.append("<tr>");
                    
                    if (primeiroItem) {
                        html.append("<td>").append(v.data != null ? v.data.format(fmt) : "-").append("</td>");
                    } else {
                        html.append("<td style='background-color: #f5f5f5;'></td>");
                    }
                    
                    html.append("<td>").append(nomeProduto).append("</td>");
                    
                    if (primeiroItem) {
                        html.append("<td>").append(cidadeNome).append("</td>");
                    } else {
                        html.append("<td style='background-color: #f5f5f5;'></td>");
                    }
                    
                    html.append("<td class='col-pequena'>").append(quantidade).append("</td>");
                    html.append("<td class='col-valor'>R$ ").append(String.format("%.2f", precoUnitario)).append("</td>");
                    
                    if (primeiroItem) {
                        html.append("<td class='col-valor'>R$ ").append(String.format("%.2f", v.valorFrete != null ? v.valorFrete : 0)).append("</td>");
                    } else {
                        html.append("<td class='col-valor' style='background-color: #f5f5f5;'></td>");
                    }

                    if (primeiroItem) {
                        html.append("<td class='col-valor'>R$ ").append(String.format("%.2f", v.valorDesconto != null ? v.valorDesconto : 0)).append("</td>");
                    } else {
                        html.append("<td class='col-valor' style='background-color: #f5f5f5;'></td>");
                    }
                    
                    if (primeiroItem) {
                        html.append("<td>").append(formaPagamento).append("</td>");
                    } else {
                        html.append("<td style='background-color: #f5f5f5;'></td>");
                    }
                    
                    if (primeiroItem) {
                        html.append("<td class='col-pequena'>").append(parcelasStr).append("</td>");
                    } else {
                        html.append("<td class='col-pequena' style='background-color: #f5f5f5;'></td>");
                    }
                    
                    if (primeiroItem) {
                        html.append("<td>").append(foiNaLoja).append("</td>");
                    } else {
                        html.append("<td style='background-color: #f5f5f5;'></td>");
                    }
                    
                    if (primeiroItem) {
                        html.append("<td>").append(v.vendedor != null ? v.vendedor : "-").append("</td>");
                    } else {
                        html.append("<td style='background-color: #f5f5f5;'></td>");
                    }

                    if (primeiroItem) {
                        html.append("<td>").append(tipoCliente).append("</td>");
                    } else {
                        html.append("<td style='background-color: #f5f5f5;'></td>");
                    }
                    
                    if (primeiroItem) {
                        html.append("<td>").append(nomeLojista).append("</td>");
                    } else {
                        html.append("<td style='background-color: #f5f5f5;'></td>");
                    }
                    
                    if (primeiroItem) {
                        html.append("<td class='col-valor'>R$ ").append(String.format("%.2f", v.valorTotal != null ? v.valorTotal : 0)).append("</td>");
                    } else {
                        html.append("<td class='col-valor' style='background-color: #f5f5f5;'></td>");
                    }

                    if (primeiroItem) {
                        html.append("<td class='col-valor'>R$ ").append(String.format("%.2f", custoTotalVenda)).append("</td>");
                    } else {
                        html.append("<td class='col-valor' style='background-color: #f5f5f5;'></td>");
                    }

                    if (primeiroItem) {
                        double lucroTotalVenda = (v.valorTotal != null ? v.valorTotal : 0) - custoTotalVenda;
                        html.append("<td class='col-valor'>R$ ").append(String.format("%.2f", lucroTotalVenda)).append("</td>");
                    } else {
                        html.append("<td class='col-valor' style='background-color: #f5f5f5;'></td>");
                    }
                    
                    html.append("</tr>");
                    
                    primeiroItem = false;

                }

            } else {

                html.append("<tr>");
                html.append("<td>").append(v.data != null ? v.data.format(fmt) : "-").append("</td>");
                html.append("<td>-</td>");
                html.append("<td>").append(cidadeNome).append("</td>");
                html.append("<td class='col-pequena'>-</td>");
                html.append("<td class='col-valor'>-</td>");
                html.append("<td class='col-valor'>R$ ").append(String.format("%.2f", v.valorFrete != null ? v.valorFrete : 0)).append("</td>");
                html.append("<td class='col-valor'>R$ ").append(String.format("%.2f", v.valorDesconto != null ? v.valorDesconto : 0)).append("</td>");
                html.append("<td>").append(formaPagamento).append("</td>");
                html.append("<td class='col-pequena'>").append(parcelasStr).append("</td>");
                html.append("<td>").append(foiNaLoja).append("</td>");
                html.append("<td>").append(v.vendedor != null ? v.vendedor : "-").append("</td>");
                html.append("<td>").append(tipoCliente).append("</td>");
                html.append("<td>").append(nomeLojista).append("</td>");
                html.append("<td class='col-valor'>R$ ").append(String.format("%.2f", v.valorTotal != null ? v.valorTotal : 0)).append("</td>");
                html.append("<td class='col-valor'>R$ ").append(String.format("%.2f", custoTotalVenda)).append("</td>");
               
                double lucroTotalVenda = (v.valorTotal != null ? v.valorTotal : 0) - custoTotalVenda;
               
                html.append("<td class='col-valor'>R$ ").append(String.format("%.2f", lucroTotalVenda)).append("</td>");
                html.append("</table>");

            }
        }
        
        html.append("</tbody>");
        html.append("</table>");
    
        html.append("<div class='footer'>");
        html.append("Programa de gestão - Desenvolvido por Ravi Soares");
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
