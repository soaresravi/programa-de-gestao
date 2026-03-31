package com.programaGestao.resource;

import com.programaGestao.model.Despesa;
import com.programaGestao.dto.DespesaDTO;
import com.programaGestao.enums.Enums.*;

import jakarta.annotation.security.RolesAllowed;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

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
        despesa.fornecedor = dto.fornecedor != null ? dto.fornecedor : false;

        despesa.persist();
        return Response.ok(despesa).build();

    }

    @GET

    public Response listar(@QueryParam("tipo") String tipo, @QueryParam("dataInicio") LocalDate dataInicio, @QueryParam("dataFim") LocalDate dataFim,
    @QueryParam("apenasFornecedor") Boolean apenasFornecedor, @QueryParam("search") String search, @QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("10") int size) {
        
        if (dataInicio == null) {
            dataInicio = LocalDate.now().withDayOfMonth(1);
        }

        if (dataFim == null) {
            dataFim = LocalDate.now();
        }

        StringBuilder query = new StringBuilder("tipo = ?1 and dataVencimento between ?2 and ?3");
        List<Object> params = new ArrayList<>();

        params.add(tipo);
        params.add(dataInicio);
        params.add(dataFim);

        if (apenasFornecedor != null && apenasFornecedor && "LOJA".equals(tipo)) {
            query.append(" and fornecedor = true");
        }

        if (search != null && !search.trim().isEmpty()) {
            query.append(" and nome like ?").append(params.size() + 1);
            params.add("%" + search + "%");
        }

        String hql = "from Despesa where " + query.toString() + " order by id desc";
        long totalCount = Despesa.count(hql, params.toArray()); 
        List<Despesa> despesas = Despesa.find(hql, params.toArray()).page(page, size).list();
        
        return Response.ok(despesas).header("X-Total-Count", totalCount).header("X-Total-Pages", (int) Math.ceil((double)
        totalCount / size )).header("X-Current-Page", page).header("X-Page-Size", size).build();

    }

    @GET
    @Path("/total")

    public Response getTotal(@QueryParam("tipo") String tipo, @QueryParam("dataInicio") LocalDate dataInicio, @QueryParam("dataFim")
    LocalDate dataFim, @QueryParam("apenasFornecedor") Boolean apenasFornecedor, @QueryParam("search") String search) {

        if (dataInicio == null) {
            dataInicio = LocalDate.now().withDayOfMonth(1);
        }

        if (dataFim == null) {
            dataFim = LocalDate.now();
        }

        StringBuilder query = new StringBuilder("tipo = ?1 and dataVencimento between ?2 and ?3");
        List<Object> params = new ArrayList<>();

        params.add(tipo);
        params.add(dataInicio);
        params.add(dataFim);

        if (apenasFornecedor != null && apenasFornecedor && "LOJA".equals(tipo)) {
            query.append(" and fornecedor = true");
        }

        if (search != null && !search.trim().isEmpty()) {
            query.append(" and nome like ?").append(params.size() + 1);
            params.add("%" + search + "%");
        }

        List<Despesa> despesas = Despesa.find("where " + query.toString(), params.toArray()).list();

        double totalValor = despesas.stream().mapToDouble(d -> d.valor != null ? d.valor : 0).sum();
        long totalPendentes = despesas.stream().filter(d -> d.status == StatusDespesa.PENDENTE).count();
        long totalAtrasadas = despesas.stream().filter(d -> d.status == StatusDespesa.ATRASADO).count();

        return Response.ok(new TotalResponse(totalValor, totalPendentes, totalAtrasadas)).build();
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

        despesa.nome = dto.nome;
        despesa.valor = dto.valor;
        despesa.dataPagamento = dto.dataPagamento;
        despesa.dataVencimento = dto.dataVencimento;
        despesa.status = dto.status;
        despesa.tipo = dto.tipo;
        despesa.fornecedor = dto.fornecedor != null ? dto.fornecedor : false;

        despesa.persist();
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

    @POST
    @Path("/exportar-pdf")
    @Produces("application/pdf")

    public Response exportarPDF(@QueryParam("tipo") String tipo, @QueryParam("dataInicio") LocalDate dataInicio, @QueryParam("dataFim") LocalDate dataFim) {

        if (dataInicio == null) {
            dataInicio = LocalDate.now().withDayOfMonth(1);
        }

        if (dataFim == null) {
            dataFim = LocalDate.now();
        }

        List<Despesa> despesas = Despesa.find("tipo = ?1 and dataVencimento between ?2 and ?3 order by id desc", tipo, dataInicio, dataFim).list();
        String html = gerarHtmlRelatorio(despesas, tipo, dataInicio, dataFim);
        
        return Response.ok(html).type(MediaType.TEXT_HTML).build();

    }

    private String gerarHtmlRelatorio(List<Despesa> despesas, String tipo, LocalDate dataInicio, LocalDate dataFim) {

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        double totalValor = despesas.stream().mapToDouble(d -> d.valor != null ? d.valor : 0).sum();

        StringBuilder html = new StringBuilder();
        
        html.append("<!DOCTYPE html>");
        html.append("<html><head>");
        html.append("<meta charset='UTF-8'>");
        html.append("<title>Relatório de despesas</title>");
        html.append("<style>");
        html.append("body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; background: #f5f5f5; }");
        html.append(".container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }");
        html.append("h1 { color: #14532d; border-left: 5px solid #22c55e; padding-left: 20px; }");
        html.append("h2 { color: #166534; font-size: 18px; margin-top: 0; }");
        html.append(".header-info { background: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 20px; }");
        html.append("table { width: 100%; border-collapse: collapse; margin-top: 20px; }");
        html.append("th { background-color: #14532d; color: white; padding: 12px; text-align: left; }");
        html.append("td { border: 1px solid #ddd; padding: 8px; }");
        html.append("tr:nth-child(even) { background-color: #f9fafb; }");
        html.append(".total { margin-top: 20px; font-size: 18px; font-weight: bold; text-align: right; }");
        html.append(".footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }");
        html.append("</style>");
        html.append("</head><body>");
        html.append("<div class='container'>");

        html.append("<h1>PROGRAMA DE GESTÃO - DAVID COLCHÕES</h1>");
        html.append("<h2> Relatório de despesas - ").append(tipo.equals("CASA") ? "Casa" : "Loja").append("</h2>");

        html.append("<div class='header-info'>");
        html.append("<div><strong> Período: </strong> ").append(dataInicio.format(fmt)).append(" a ").append(dataFim.format(fmt)).append("</div>");
        html.append("<div><strong> Gerado em: </strong>").append(LocalDate.now().format(fmt)).append("</div>");
        html.append("</div>");

        html.append("  \n");
        html.append("<table>");
        html.append("<thead>\n");
        html.append("<tr>");
        html.append("<th>Nome</th><th>Valor</th><th>Data Pagamento</th><th>Data Vencimento</th><th>Status</th>");
        html.append("</tr>");
        html.append("</thead><tbody>");

        for (Despesa d : despesas) {
            html.append("<tr>");
            html.append("<td>").append(d.nome != null ? d.nome : "-").append("</td>");
            html.append("<td>R$ ").append(String.format("%,.2f", d.valor != null ? d.valor : 0)).append("</td>");
            html.append("<td>").append(d.dataPagamento != null ? d.dataPagamento.format(fmt) : "-").append("</td>");
            html.append("<td>").append(d.dataVencimento != null ? d.dataVencimento.format(fmt) : "-").append("</td>");
            html.append("<td>").append(d.status != null ? d.status : "-").append("</td>");
            html.append("</tr>");
        }

        html.append("</tbody>");
        html.append("</table>");
        html.append("<div class='total'> Total: R$ ").append(String.format("%,.2f", totalValor)).append("</div>");
        html.append("<div class='footer'> Programa de gestão - Desenvolvido por Ravi Soares </div>");
        html.append("</div></body></html>");

        return html.toString();

    }

    private static class TotalResponse {

        public double totalValor;
        public long totalPendentes;
        public long totalAtrasadas;

        public TotalResponse(double totalValor, long totalPendentes, long totalAtrasadas) {
            this.totalValor = totalValor;
            this.totalPendentes = totalPendentes;
            this.totalAtrasadas = totalAtrasadas;
        }
    }
}
