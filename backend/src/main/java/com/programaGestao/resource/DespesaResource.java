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

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

import org.xhtmlrenderer.pdf.ITextRenderer;

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

        StringBuilder query = new StringBuilder("tipo = ?1 and (dataVencimento between ?2 and ?3 or dataVencimento is null)");
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

        StringBuilder query = new StringBuilder("tipo = ?1 and (dataVencimento between ?2 and ?3 or dataVencimento is null");
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

    public Response exportarPDF(@QueryParam("tipo") String tipo, @QueryParam("dataInicio") String dataInicioStr, @QueryParam("dataFim") String dataFimStr) {

        try {

            if (tipo == null || tipo.isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST).entity("Tipo é obrigatório").build();
            }

            LocalDate dataInicio, dataFim;

            if (dataInicioStr != null && !dataInicioStr.isEmpty()) {
                dataInicio = LocalDate.parse(dataInicioStr);
            } else {
                dataInicio = LocalDate.now().withDayOfMonth(1);
            }
    
            if (dataFimStr != null && !dataFimStr.isEmpty()) {
                dataFim = LocalDate.parse(dataFimStr);
            } else {
                dataFim = LocalDate.now();
            }

            List <Despesa> despesas = Despesa.find("tipo = ?1 and (dataVencimento between ?2 and ?3 or dataVencimento is null) order by id desc", tipo, dataInicio, dataFim).list();
            String html = gerarHtmlRelatorio(despesas, tipo, dataInicio, dataFim);

            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
            ITextRenderer renderer = new ITextRenderer();
            
            renderer.setDocumentFromString(html);
            renderer.layout();
            renderer.createPDF(byteArrayOutputStream);

            byte[] pdfBytes = byteArrayOutputStream.toByteArray();

            String filename = "relatorio_despesas_" + tipo.toLowerCase() + "_" + dataInicio.toString() + "_a_" + dataFim.toString() + ".pdf";
            return Response.ok(pdfBytes).type("application/pdf").header("Content-Disposition", "attachment; filename=" + filename).build();

        } catch (DateTimeParseException error) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Formato de data inválido. Use YYYY-MM-DD").build();
        } catch (Exception error) {
            error.printStackTrace();
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity("Erro ao gerar PDF: " + error.getMessage()).build();
        }
    }

    private String gerarHtmlRelatorio(List<Despesa> despesas, String tipo, LocalDate dataInicio, LocalDate dataFim) {

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        double totalValor = despesas.stream().mapToDouble(d -> d.valor != null ? d.valor : 0).sum();
        
        long totalPendentes = despesas.stream().filter(d -> d.status == StatusDespesa.PENDENTE).count();
        long totalPagas = despesas.stream().filter(d -> d.status == StatusDespesa.PAGO).count();
        long totalAtrasadas = despesas.stream().filter(d -> d.status == StatusDespesa.ATRASADO).count();
    
        StringBuilder html = new StringBuilder();
        
        html.append("<!DOCTYPE html>");
        html.append("<html><head>");
        html.append("<meta charset='UTF-8' />");
        
        html.append("<style>");
        html.append("@page { size: portrait; margin: 0.8cm; }");
        html.append("body { font-family: Helvetica, Times New Roman; font-size: 11px; color: #333; margin: 0; }");
        html.append(".container { width: 100%; }");
        
        html.append("h1 { color: #000000; font-weight: bold; font-size: 16px; margin: 0 0 5px 0; }");
        html.append("h2 { color: #166534; font-size: 13px; margin: 0 0 10px 0; }");
        
        html.append(".header-info { width: 100%; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px; display: flex; justify-content: space-between; }");
        
        html.append(".summary-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }");
        html.append(".summary-card { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 6px; text-align: center; }");
        html.append(".summary-card h3 { margin: 0; font-size: 10px; color: #166534; text-transform: uppercase; }");
        html.append(".summary-card .value { font-size: 14px; font-weight: bold; color: #14532d; }");
        
        html.append(".badge { padding: 1px 4px; border-radius: 4px; font-size: 8px; font-weight: bold; display: inline-block; }");
        html.append(".badge-pago { background: #dcfce7; color: #166534; }");
        html.append(".badge-pendente { background: #fef3c7; color: #92400e; }");
        html.append(".badge-atrasado { background: #fee2e2; color: #991b1b; }");
        
        html.append("table { width: 100%; border-collapse: collapse; font-size: 9px; table-layout: auto; }");
        html.append("th { background-color: #14532d; color: white; padding: 6px 4px; text-align: left; }");
        html.append("td { border: 1px solid #e5e7eb; padding: 5px 4px; vertical-align: top; }");
        html.append("tr:nth-child(even) { background-color: #f9fafb; }");
        
        html.append(".footer { margin-top: 20px; text-align: center; font-size: 8px; color: #6b7280; }");
        
        html.append(".col-valor { text-align: right; }");
        html.append("td.col-valor { text-align: right; }");
        
        html.append("</style>");
        html.append("</head><body>");
        html.append("<div class='container'>");
        
        html.append("<h1> Programa de Gestão - David Colchões </h1>");
        html.append("<h2>Relatório de despesas - ").append(tipo.equals("CASA") ? "Casa" : "Loja").append("</h2>");
        
        html.append("<div class='header-info'>");
        html.append("<div><strong>Período:</strong> ").append(dataInicio.format(fmt)).append(" a ").append(dataFim.format(fmt)).append("</div>");
        html.append("<div><strong>Gerado em:</strong> ").append(LocalDate.now().format(fmt)).append("</div>");
        html.append("</div>");

        html.append("<table class='summary-table'>");
        html.append("<tr>");
        html.append("<td class='summary-card' width='25%'><h3>Total</h3><div class='value'>R$ ").append(String.format("%,.2f", totalValor)).append("</div></td>");
        html.append("<td class='summary-card' width='25%'><h3>Pagas</h3><div class='value'>").append(totalPagas).append("</div></td>");
        html.append("<td class='summary-card' width='25%'><h3>Pendentes</h3><div class='value'>").append(totalPendentes).append("</div></td>");
        html.append("<td class='summary-card' width='25%'><h3>Atrasadas</h3><div class='value'>").append(totalAtrasadas).append("</div></td>");
        html.append("</tr>");
        html.append("</table>");
       
        html.append("<table>"); 
        html.append("<thead>");
        html.append("<tr>");
        html.append("<th>Nome</th>");
        html.append("<th class='col-valor'>Valor</th>");
        html.append("<th>Data Pagamento</th>");
        html.append("<th>Data Vencimento</th>");
        html.append("<th>Status</th>");
       
        if (tipo.equals("LOJA")) {
            html.append("<th>Fornecedor</th>");
        }

        html.append("</tr>");
        html.append("</thead><tbody>");
        
        for (Despesa d : despesas) {
            
            String badgeClass = "";
            String statusText = "";
            
            if (d.status != null) {
               
                switch (d.status) {
                   
                    case PAGO:
                        badgeClass = "badge-pago";
                        statusText = "Pago";
                        break;
                    case PENDENTE:
                        badgeClass = "badge-pendente";
                        statusText = "Pendente";
                        break;
                    case ATRASADO:
                        badgeClass = "badge-atrasado";
                        statusText = "Atrasado";
                        break;
                }

            }
            
            html.append("<tr>");
            html.append("<td>").append(d.nome != null ? d.nome : "-").append("</td>");
            html.append("<td class='col-valor'>R$ ").append(String.format("%,.2f", d.valor != null ? d.valor : 0)).append("</td>");
            html.append("<td>").append(d.dataPagamento != null ? d.dataPagamento.format(fmt) : "-").append("</td>");
            html.append("<td>").append(d.dataVencimento != null ? d.dataVencimento.format(fmt) : "-").append("</td>");
            html.append("<td><span class='badge ").append(badgeClass).append("'>").append(statusText).append("</span></td>");
           
            if (tipo.equals("LOJA")) {
                html.append("<td>").append(d.fornecedor != null && d.fornecedor ? "Sim" : "Não").append("</td>");
            }

            html.append("</tr>");
            
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
