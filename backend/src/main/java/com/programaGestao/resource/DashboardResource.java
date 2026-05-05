package com.programaGestao.resource;

import com.programaGestao.model.*;

import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import org.xhtmlrenderer.pdf.ITextRenderer;

@Path("/dashboard")
@RolesAllowed("user")

@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)

public class DashboardResource {

    private LocalDate[] getDatasPadrao() {
        
        LocalDate inicio = LocalDate.now().withDayOfMonth(1);
        LocalDate fim = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());
        
        return new LocalDate[]{inicio, fim};
        
    }
    
    @GET
    @Path("/resumo")
    
    public Response getResumo(@QueryParam("dataInicio") LocalDate dataInicio, @QueryParam("dataFim") LocalDate dataFim) {
        
        if (dataInicio == null || dataFim == null) {
            LocalDate[] padrao = getDatasPadrao();
            dataInicio = padrao[0];
            dataFim = padrao[1];    
        }
        
        List<Venda> vendas = Venda.find("data between ?1 and ?2", dataInicio, dataFim).list();
        
        double totalReceitas = vendas.stream().mapToDouble(v -> v.valorTotal != null ? v.valorTotal : 0).sum();
        int totalVendas = vendas.size();

        double totalCustoProducao = vendas.stream().mapToDouble(v -> {
            
            double custo = 0;
            
            if (v.itens != null) {
                custo = v.itens.stream().mapToDouble(i -> i.quantidade * (i.custoUnitario != null ? i.custoUnitario : 0)).sum();
            }
            
            return custo;

        }).sum();
        
        double despesasLoja = Despesa.<Despesa>find("tipo = 'LOJA' and ((dataVencimento between ?1 and ?2) or (dataPagamento between ?1 and ?2))", dataInicio, dataFim).stream().mapToDouble(d -> d.valor != null ? d.valor : 0).sum();
        double despesasCasa = Despesa.<Despesa>find("tipo = 'CASA' and ((dataVencimento between ?1 and ?2) or (dataPagamento between ?1 and ?2))", dataInicio, dataFim).stream().mapToDouble(d -> d.valor != null ? d.valor : 0).sum();    
        
        double lucroLiquido = totalReceitas - totalCustoProducao - despesasLoja;
        
        Map<String, Object> resumo = new HashMap<>();
        
        resumo.put("totalReceitas", totalReceitas);
        resumo.put("totalVendas", totalVendas);
        resumo.put("totalCustoProducao", totalCustoProducao);
        resumo.put("despesasLoja", despesasLoja);
        resumo.put("despesasCasa", despesasCasa);
        resumo.put("lucroLiquido", lucroLiquido);
        resumo.put("periodoInicio", dataInicio);
        resumo.put("periodoFim", dataFim);
        
        return Response.ok(resumo).build();
    
    }

    @GET
    @Path("/evolucao-mensal")

    public Response getEvolucaoMensal() {

        LocalDate hoje = LocalDate.now();
        LocalDate inicio = hoje.minusMonths(11).withDayOfMonth(1);      

        Map<String, Map<String, Double>> dados = new LinkedHashMap<>();

        for (int i=0; i<12; i++) {

            LocalDate mes = inicio.plusMonths(i);
            String nomeMes = mes.format(DateTimeFormatter.ofPattern("MMM/yyyy"));
            
            List<Venda> vendasMes = Venda.find("data between ?1 and ?2", mes.withDayOfMonth(1), mes.withDayOfMonth(mes.lengthOfMonth())).list();

            double receitas = vendasMes.stream().mapToDouble(v -> v.valorTotal != null ? v.valorTotal : 0).sum();
            
            double despesas = Despesa.<Despesa>find("tipo = 'LOJA' and dataVencimento between ?1 and ?2", mes.withDayOfMonth
            (1), mes.withDayOfMonth(mes.lengthOfMonth())).stream().mapToDouble(d -> d.valor != null ? d.valor : 0).sum();

            Map<String, Double> mesDados = new HashMap<>();

            mesDados.put("receitas", receitas);
            mesDados.put("despesas", despesas);
            dados.put(nomeMes, mesDados);

        }

        List<Double> valoresReceita = dados.values().stream().map(m -> m.get("receitas")).collect(Collectors.toList());
        List<Double> projecao = calcularProjecao(valoresReceita, 3);

        Map<String, Object> resultado = new HashMap<>();

        resultado.put("historico", dados);
        resultado.put("projecao", projecao);

        return Response.ok(resultado).build();

    }
    
    @GET
    @Path("/gastos-casa-vs-loja")
    
    public Response getGastosCasaVsLoja(@QueryParam("dataInicio") LocalDate dataInicio, @QueryParam("dataFim") LocalDate dataFim) {
        
        if (dataInicio == null || dataFim == null) {
            LocalDate[] padrao = getDatasPadrao();
            dataInicio = padrao[0];
            dataFim = padrao[1];
        }

        double gastosCasa = Despesa.<Despesa>find("tipo = 'CASA' and ((dataVencimento between ?1 and ?2) or (dataPagamento between ?1 and ?2))", dataInicio, dataFim).stream().mapToDouble(d -> d.valor != null ? d.valor : 0).sum();
        double gastosLoja = Despesa.<Despesa>find("tipo = 'LOJA' and ((dataVencimento between ?1 and ?2) or (dataPagamento between ?1 and ?2))", dataInicio, dataFim).stream().mapToDouble(d -> d.valor != null ? d.valor : 0).sum();  
        
        Map<String, Double> resultado = new HashMap<>();
        
        resultado.put("casa", gastosCasa);
        resultado.put("loja", gastosLoja);
        
        return Response.ok(resultado).build();
        
    }

    @GET
    @Path("/desempenho-produtos")

    public Response getDesempenhoProdutos(@QueryParam("dataInicio") LocalDate dataInicio, @QueryParam("dataFim") LocalDate dataFim) {

        if (dataInicio == null || dataFim == null) {
            
            LocalDate[] padrao = getDatasPadrao();
           
            dataInicio = padrao[0];
            dataFim = padrao[1];
        
        }

        List<Venda> vendas = Venda.find("data between ?1 and ?2", dataInicio, dataFim).list();

        Map<String, Double> lucroPorTipo = new HashMap<>();
        Map<String, Integer> quantidadePorTipo = new HashMap<>();

        for (Venda v : vendas) {

            if (v.itens != null) {
                
                for (ItemVenda i : v.itens) {

                    if (i.produto != null && i.produto.tipo != null) {
                        String tipo = i.produto.tipo.name();
                        double lucro = (i.precoUnitario != null ? i.precoUnitario : 0) - (i.custoUnitario != null ? i.custoUnitario : 0);
                        lucroPorTipo.merge(tipo, lucro * i.quantidade, Double::sum);
                        quantidadePorTipo.merge(tipo, i.quantidade, Integer::sum);
                    }

                }
            }
        }

        Map<String, Object> resultado = new HashMap<>();

        resultado.put("lucro", lucroPorTipo);
        resultado.put("quantidade", quantidadePorTipo);

        return Response.ok(resultado).build();

    }

    @GET
    @Path("/ranking-clientes")

    public Response getRankingClientes(@QueryParam("dataInicio") LocalDate dataInicio, @QueryParam("dataFim") LocalDate dataFim) {

        if (dataInicio == null || dataFim == null) {
            
            LocalDate[] padrao = getDatasPadrao();
        
            dataInicio = padrao[0];
            dataFim = padrao[1];
        
        }

        List<Venda> vendas = Venda.find("data between ?1 and ?2", dataInicio, dataFim).list();

        double lucroClienteFinal = 0;
        double lucroLojista = 0;

        for (Venda v : vendas) {

            if (v.lucroBruto != null) {

                if (v.clienteFinal != null && v.clienteFinal) {
                    lucroClienteFinal += v.lucroBruto;
                } else {
                    lucroLojista += v.lucroBruto;
                }

            }
        }

        Map<String, Double> resultado = new HashMap<>();

        resultado.put("clienteFinal", lucroClienteFinal);
        resultado.put("lojista", lucroLojista);

        return Response.ok(resultado).build();

    }

    @GET
    @Path("/origem-vendas")

    public Response getOrigemVendas(@QueryParam("dataInicio") LocalDate dataInicio, @QueryParam("dataFim") LocalDate dataFim) {

        if (dataInicio == null || dataFim == null) {
           
            LocalDate[] padrao = getDatasPadrao();
        
            dataInicio = padrao[0];
            dataFim = padrao[1];
        
        }

        List<Venda> vendas = Venda.find("data between ?1 and ?2", dataInicio, dataFim).list();

        double vendasLojaFisica = 0;
        double vendasOutros = 0;

        for (Venda v : vendas) {

            if (v.valorTotal != null) {

                if (v.foiNaLoja != null && v.foiNaLoja) {
                    vendasLojaFisica += v.valorTotal;
                } else {
                    vendasOutros += v.valorTotal;
                }

            }
        }

        Map<String, Double> resultado = new HashMap<>();

        resultado.put("lojaFisica", vendasLojaFisica);
        resultado.put("outros", vendasOutros);

        return Response.ok(resultado).build();

    }

    @GET
    @Path("/alertas")

    public Response getAlertas() {

        LocalDate hoje = LocalDate.now();
        LocalDate amanha = hoje.plusDays(1);

        List<Despesa> vencendoHoje = Despesa.find("status != 'PAGO' and dataVencimento = ?1", hoje).list();
        List<Despesa> vencendoAmanha = Despesa.find("status != 'PAGO' and dataVencimento = ?1", amanha).list();

        Map<String, Object> resultado = new HashMap<>();
        
        resultado.put("vencendoHoje", vencendoHoje);
        resultado.put("vencendoAmanha", vencendoAmanha);

        return Response.ok(resultado).build();

    }

    @GET
    @Path("/relacao-produtos")

    public Response getRelacaoProdutos(@QueryParam("dataInicio") LocalDate dataInicio, @QueryParam("dataFim") LocalDate dataFim) {

        if (dataInicio == null || dataFim == null) {
           
            LocalDate[] padrao = getDatasPadrao();
            
            dataInicio = padrao[0];
            dataFim = padrao[1];
        
        }

        List<Venda> vendas = Venda.find("data between ?1 and ?2", dataInicio, dataFim).list();

        Map<Long, Integer> quantidadePorProduto = new HashMap<>();
        Map<Long, String> nomePorProduto = new HashMap<>();

        for (Venda v : vendas) {

            if (v.itens != null) {

                for (ItemVenda i : v.itens) {

                    if (i.produto != null && i.produto.tipo != null && !i.produto.tipo.name().equalsIgnoreCase("MATERIA_PRIMA")) {
                        Long id = i.produto.id;
                        quantidadePorProduto.merge(id, i.quantidade, Integer::sum);
                        nomePorProduto.putIfAbsent(id, i.produto.nome);
                    }

                }
            }
        }

        List<Map<String, Object>> relacao = new ArrayList<>();

        for (Map.Entry<Long, Integer> entry : quantidadePorProduto.entrySet()) {

            Map<String, Object> item = new HashMap<>();

            item.put("id", entry.getKey());
            item.put("nome", nomePorProduto.get(entry.getKey()));
            item.put("quantidade", entry.getValue());

            relacao.add(item);

        }

        relacao.sort((a, b) -> Integer.compare((Integer) b.get("quantidade"), (Integer) a.get("quantidade")));
        return Response.ok(relacao).build();

    }

    @GET
    @Path("/ranking-lojistas")

    public Response getRankingLojistas(@QueryParam("dataInicio") LocalDate dataInicio, @QueryParam("dataFim") LocalDate dataFim) {

        if (dataInicio == null || dataFim == null) {
           
            LocalDate[] padrao = getDatasPadrao();
           
            dataInicio = padrao[0];
            dataFim = padrao[1];
        
        }

        List<Venda> vendas = Venda.find("lojista is not null and data between ?1 and ?2", dataInicio, dataFim).list();

        Map<Long, Double> totalGasto = new HashMap<>();
        Map<Long, Integer> totalVendas = new HashMap<>();
        Map<Long, String> nomeLojista = new HashMap<>();

        for (Venda v : vendas) {

            if (v.lojista != null) {
                Long id = v.lojista.id;
                totalGasto.merge(id, v.valorTotal != null ? v.valorTotal : 0, Double::sum);
                totalVendas.merge(id, 1, Integer::sum);
                nomeLojista.putIfAbsent(id, v.lojista.nome); 
            }

        }

        List<Map<String, Object>> ranking = new ArrayList<>();

        for (Long id : totalGasto.keySet()) {

            Map<String, Object> item = new HashMap<>();

            item.put("id", id);
            item.put("nome", nomeLojista.get(id));
            item.put("totalGasto", totalGasto.get(id));

            ranking.add(item);

        }

        ranking.sort((a, b) -> Double.compare((Double) b.get("totalGasto"), (Double) a.get("totalGasto")));

        return Response.ok(ranking).build();

    }

    @GET
    @Path("/ranking-vendedores")

    public Response getRankingVendedores(@QueryParam("dataInicio") LocalDate dataInicio, @QueryParam("dataFim") LocalDate dataFim) {

        if (dataInicio == null || dataFim == null) {
          
            LocalDate[] padrao = getDatasPadrao();
            
            dataInicio = padrao[0];
            dataFim = padrao[1];
        
        }

        List<Venda> vendas = Venda.find("data between ?1 and ?2", dataInicio, dataFim).list();

        Map<String, Double> totalVendido = new HashMap<>();
        Map<String, Double> totalLucro = new HashMap<>();

        for (Venda v : vendas) {

            if (v.vendedor != null && !v.vendedor.trim().isEmpty()) {
                String vendedor = v.vendedor;
                totalVendido.merge(vendedor, v.valorTotal != null ? v.valorTotal : 0, Double::sum);
                totalLucro.merge(vendedor, v.lucroBruto != null ? v.lucroBruto : 0, Double::sum);
            }

        }

        List<Map<String, Object>> ranking = new ArrayList<>();

        for (String vendedor : totalVendido.keySet()) {

            Map<String, Object> item = new HashMap<>();

            item.put("vendedor", vendedor);
            item.put("totalVendido", totalVendido.get(vendedor));
            item.put("totalLucro", totalLucro.get(vendedor));

            ranking.add(item);

        }

        ranking.sort((a, b) -> Double.compare((Double) b.get("totalVendido"), (Double) a.get("totalVendido")));

        return Response.ok(ranking).build();

    }
    @POST
    @Path("/exportar-pdf")
    
    public Response exportarPDF(@QueryParam("dataInicio") String dataInicioStr, @QueryParam("dataFim") String dataFimStr) {
        
        try {
            
            LocalDate dataInicio, dataFim;

            if (dataInicioStr != null && !dataInicioStr.isEmpty() && dataFimStr != null && !dataFimStr.isEmpty()) {
                dataInicio = LocalDate.parse(dataInicioStr);
                dataFim = LocalDate.parse(dataFimStr);
            } else {
                dataInicio = LocalDate.now().withDayOfMonth(1);
                dataFim = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());
            }
            
            List<Venda> vendas = Venda.find("data between ?1 and ?2", dataInicio, dataFim).list();
            List<Despesa> despesasLoja = Despesa.find("tipo = 'LOJA' and ((dataVencimento between ?1 and ?2) or (dataPagamento between ?1 and ?2))", dataInicio, dataFim).list();
            List<Despesa> despesasCasa = Despesa.find("tipo = 'CASA' and ((dataVencimento between ?1 and ?2) or (dataPagamento between ?1 and ?2))", dataInicio, dataFim).list();
            
            double totalReceitas = vendas.stream().mapToDouble(v -> v.valorTotal != null ? v.valorTotal : 0).sum();
            
            double totalCusto = vendas.stream().mapToDouble(v -> {
                if (v.itens == null) return 0;
                return v.itens.stream().mapToDouble(i -> i.quantidade * (i.custoUnitario != null ? i.custoUnitario : 0)).sum();
            }).sum();
            
            double despesasLojaTotal = despesasLoja.stream().mapToDouble(d -> d.valor != null ? d.valor : 0).sum();
            double despesasCasaTotal = despesasCasa.stream().mapToDouble(d -> d.valor != null ? d.valor : 0).sum();
            
            double lucroLiquido = totalReceitas - totalCusto - despesasLojaTotal;
            
            Map<String, Double> lucroPorTipo = new HashMap<>();
            Map<String, Integer> quantidadePorTipo = new HashMap<>();
            
            for (Venda v : vendas) {  
                
                if (v.itens != null) {   
                   
                    for (ItemVenda i : v.itens) {
                        
                        if (i.produto != null && i.produto.tipo != null) {
                            String tipo = i.produto.tipo.name();
                            double lucro = (i.precoUnitario != null ? i.precoUnitario : 0) - (i.custoUnitario != null ? i.custoUnitario : 0);
                            lucroPorTipo.merge(tipo, lucro * i.quantidade, Double::sum);
                            quantidadePorTipo.merge(tipo, i.quantidade, Integer::sum);
                        }

                    }

                }

            }
            
            double vendasLojaFisica = vendas.stream().filter(v -> v.foiNaLoja != null && v.foiNaLoja).mapToDouble(v -> v.valorTotal != null ? v.valorTotal : 0).sum();
            double vendasOutros = totalReceitas - vendasLojaFisica;
            double lucroClienteFinal = vendas.stream().filter(v -> v.clienteFinal != null && v.clienteFinal).mapToDouble(v -> v.lucroBruto != null ? v.lucroBruto : 0).sum();
            double lucroLojista = vendas.stream().filter(v -> v.clienteFinal != null && !v.clienteFinal).mapToDouble(v -> v.lucroBruto != null ? v.lucroBruto : 0).sum();
            
            Map<Long, Integer> qtdPorProduto = new HashMap<>();
            Map<Long, String> nomePorProduto = new HashMap<>();
            
            for (Venda v : vendas) {
                
                if (v.itens != null) {
                    
                    for (ItemVenda i : v.itens) {
                        
                        if (i.produto != null && i.produto.tipo != null && !i.produto.tipo.name().equalsIgnoreCase("MATERIA_PRIMA")) {
                            qtdPorProduto.merge(i.produto.id, i.quantidade, Integer::sum);
                            nomePorProduto.putIfAbsent(i.produto.id, i.produto.nome);
                        }

                    }

                }

            }
            
            List<Map<String, Object>> relacaoProdutos = qtdPorProduto.entrySet().stream().map(e -> { Map<String, Object> m = new HashMap<>(); m.put("nome", nomePorProduto.get(e.getKey())); m.put("quantidade", e.getValue()); return m; }).sorted((a, b) -> Integer.compare((Integer) b.get("quantidade"), (Integer) a.get("quantidade"))).collect(Collectors.toList());
  
            Map<String, Double> totalVendidoVendedor = new HashMap<>();
            vendas.stream().filter(v -> v.vendedor != null).forEach(v -> totalVendidoVendedor.merge(v.vendedor, v.valorTotal, Double::sum));
            List<Map<String, Object>> rankingVendedores = totalVendidoVendedor.entrySet().stream().map(e -> { Map<String, Object> m = new HashMap<>(); m.put("vendedor", e.getKey()); m.put("totalVendido", e.getValue()); return m; }).sorted((a, b) -> Double.compare((Double) b.get("totalVendido"), (Double) a.get("totalVendido"))).collect(Collectors.toList());
            int totalItensGeral = relacaoProdutos.stream().mapToInt(m -> (Integer) m.get("quantidade")).sum();

            String html = gerarHtmlRelatorio(dataInicio, dataFim, totalReceitas, totalCusto, despesasLojaTotal, despesasCasaTotal, lucroLiquido, lucroPorTipo, quantidadePorTipo, vendasLojaFisica, vendasOutros, vendas.size(), lucroClienteFinal, lucroLojista, relacaoProdutos, rankingVendedores, totalItensGeral);
            
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ITextRenderer renderer = new ITextRenderer();
        
            renderer.setDocumentFromString(html);
            renderer.layout();
            renderer.createPDF(baos);
        
            byte[] pdfBytes = baos.toByteArray();
            String filename = "dashboard_" + dataInicio + "_a_" + dataFim + ".pdf";
            
            return Response.ok(pdfBytes).type("application/pdf").header("Content-Disposition", "attachment; filename=" + filename).build();

        } catch (Exception e) {
            e.printStackTrace();
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity("Erro ao gerar PDF").build();
        }
    }

    private String gerarHtmlRelatorio(LocalDate dataInicio, LocalDate dataFim, double totalReceitas, double totalCusto, double despesasLoja,
    double despesasCasa, double lucroLiquido, Map<String, Double> lucroPorTipo, Map<String, Integer> quantidadePorTipo, double vendasLojaFisica,
    double vendasOutros, int totalVendas, double lucroClienteFinal, double lucroLojista, List<Map<String, Object>> relacaoProdutos, List<Map<String, Object>>rankingVendedores, int totalItensGeral) {
        
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        
        StringBuilder html = new StringBuilder();
        
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8' />");
        html.append("<style>");
        html.append("@page { size: portrait; margin: 0.8cm; }");
        html.append("body { font-family: Helvetica, Arial, sans-serif; font-size: 10px; color: #333; margin: 0; }");
        html.append(".header { border-bottom: 2px solid #14532d; padding-bottom: 10px; margin-bottom: 20px; }");
        html.append(".header h1 { margin: 0; font-size: 18px; color: #000; }");
        html.append(".header p { margin: 2px 0; color: #666; font-size: 11px; }");
        
        html.append(".summary-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }");
        html.append(".summary-card { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 8px; text-align: center; }");
        html.append(".summary-card h3 { margin: 0; font-size: 9px; color: #166534; text-transform: uppercase; }");
        html.append(".summary-card .value { font-size: 13px; font-weight: bold; color: #14532d; margin-top: 4px; }");
    
        html.append("h2 { font-size: 12px; color: #14532d; border-left: 3px solid #22c55e; padding-left: 8px; margin: 15px 0 8px 0; }");
        html.append("table.dados { width: 100%; border-collapse: collapse; margin-bottom: 15px; }");
        html.append("table.dados th { background-color: #14532d; color: white; padding: 6px; text-align: left; font-size: 9px; }");
        html.append("table.dados td { border: 1px solid #e5e7eb; padding: 5px; }");
        html.append("tr:nth-child(even) { background-color: #f9fafb; }");
        
        html.append(".col-container { width: 100%; }");
        html.append(".col { width: 48%; vertical-align: top; }");
        html.append(".col-spacer { width: 4%; }");
        
        html.append(".footer { margin-top: 30px; text-align: center; font-size: 8px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }");
        html.append("</style></head><body>");
        
        html.append("<div class='header'>");
        html.append("<h1>Programa de Gestão - David Colchões</h1>");
        html.append("<h2>Relatório completo da sua dashboard</h2>");
        html.append("<p>Período: ").append(dataInicio.format(fmt)).append(" a ").append(dataFim.format(fmt)).append(" | Gerado em: ").append(LocalDate.now().format(fmt)).append("</p>");
        html.append("</div>");
        
        html.append("<table class='summary-table'><tr>");
        html.append("<td class='summary-card'><h3>Receita Total</h3><div class='value'>R$ ").append(String.format("%,.2f", totalReceitas)).append("</div></td>");
        html.append("<td class='summary-card'><h3>Custos Totais</h3><div class='value'>R$ ").append(String.format("%,.2f", totalCusto)).append("</div></td>");
        html.append("<td class='summary-card'><h3>Despesas Loja</h3><div class='value'>R$ ").append(String.format("%,.2f", despesasLoja)).append("</div></td>");
        html.append("<td class='summary-card'><h3>Despesas Casa</h3><div class='value'>R$ ").append(String.format("%,.2f", despesasCasa)).append("</div></td>");
        html.append("<td class='summary-card' style='background:#dcfce7;'><h3>Lucro Líquido</h3><div class='value'>R$ ").append(String.format("%,.2f", lucroLiquido)).append("</div></td>");
        html.append("</tr></table>");
        
        html.append("<table class='col-container'><tr><td class='col'>");
        html.append("<h2>Desempenho por tipo</h2>");
        html.append("<table class='dados'><thead><tr><th>Tipo</th><th>Qtd</th><th>Lucro</th></tr></thead><tbody>");
    
        for (Map.Entry<String, Double> entry : lucroPorTipo.entrySet()) {
            html.append("<tr><td>").append(entry.getKey()).append("</td>");
            html.append("<td>").append(quantidadePorTipo.getOrDefault(entry.getKey(), 0)).append("</td>");
            html.append("<td>R$ ").append(String.format("%,.2f", entry.getValue())).append("</td></tr>");
        }
        
        html.append("</tbody></table></td>");
        
        html.append("<td class='col-spacer'></td><td class='col'>");
        html.append("<h2>Origem e clientes</h2>");
        html.append("<table class='dados'><thead><tr><th>Descrição</th><th>Valor / Lucro</th></tr></thead><tbody>");
        html.append("<tr><td>Vendas na loja </td><td>R$ ").append(String.format("%,.2f", vendasLojaFisica)).append("</td></tr>");
        html.append("<tr><td>Vendas WhatsApp/Facebook</td><td>R$ ").append(String.format("%,.2f", vendasOutros)).append("</td></tr>");
        html.append("<tr><td>Lucro clientes</td><td>R$ ").append(String.format("%,.2f", lucroClienteFinal)).append("</td></tr>");
        html.append("<tr><td>Lucro lojistas</td><td>R$ ").append(String.format("%,.2f", lucroLojista)).append("</td></tr>");
        html.append("</tbody></table></td></tr></table>");
        
        html.append("<table class='col-container'><tr><td class='col'>");
        html.append("<h2>Relação de produtos vendidos</h2>");
        html.append("<table class='dados'><thead><tr><th>Produto</th><th>Quantidade</th></tr></thead><tbody>");
        
        for (Map<String, Object> p : relacaoProdutos) {
            html.append("<tr><td>").append(p.get("nome")).append("</td><td>").append(p.get("quantidade")).append("</td></tr>");
        }
        
        html.append("</tbody></table></td>");

        html.append("<div style='text-align:right; font-weight:bold; font-size:12px; margin-top:5px;'>");
        html.append("Total: ").append(totalItensGeral).append(" unidades vendidas");
        html.append("</div></td>");
        
        html.append("<table class='col-container'><tr><td class='col'>");
        html.append("<h2>Ranking vendedores</h2>");
        html.append("<table class='dados'><thead><tr><th>Vendedor</th><th>Vendido</th></tr></thead><tbody>");
    
        for (Map<String, Object> v : rankingVendedores) {
            html.append("<tr><td>").append(v.get("vendedor")).append("</td><td>R$ ").append(String.format("%,.2f", v.get("totalVendido"))).append("</td></tr>");
        }
        
        html.append("</tbody></table></td>");
        
        html.append("<td class='col-spacer'></td><td class='col'>");
        html.append("<h2>Indicadores gerais</h2>");
        html.append("<table class='dados'><tbody>");
        html.append("<tr><td>Total de vendas</td><td>").append(totalVendas).append("</td></tr>");
        html.append("<tr><td>Total de itens</td><td>").append(totalItensGeral).append("</td></tr>");
        html.append("<tr><td>Margem líquida</td><td>").append(String.format("%.1f", totalReceitas > 0 ? (lucroLiquido/totalReceitas)*100 : 0)).append("%</td></tr>");
        html.append("</tbody></table></td></tr></table>");
        
        html.append("<div class='footer'>Relatório Gerencial - David Colchões | Sistema de Gestão Interna</div>");
        html.append("</body></html>");
        
        return html.toString();
    
    }

    private List<Double> calcularProjecao(List<Double> valores, int mesesProjetar) {

        int n = valores.size();

        if (n < 2) {

            List<Double> projecao = new ArrayList<>();

            for (int i=0; i < mesesProjetar; i++) {
                projecao.add(valores.isEmpty() ? 0 : valores.get(valores.size() - 1));
            }

            return projecao;

        }

        double sumX = 0, sumY = 0, sumXY = 0, sumX2=0;

        for (int i=0; i<n; i++) {

            double x = i+1;
            double y = valores.get(i);

            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;

        }

        double slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        double intercept = (sumY - slope * sumX) / n;

        List<Double> projecao = new ArrayList<>();

        for (int i=1; i <= mesesProjetar; i++) {
            
            double x = n + i;
            double valor = slope * x + intercept;
            
            valor = Math.round(valor * 100.0) / 100.0;
            projecao.add(valor);
            
        }

        return projecao;
    }

    private String formatarTipoProduto(String tipo) {

        switch (tipo) {

            case "BOX_BAU": return "Box Baú";
            case "BASE_BOX": return "Base Box";
            case "CAMA_CONJUGADA": return "Cama Conjugada";
            case "COLCHAO_ESPUMA": return "Colchão de espuma";
            case "COLCHAO_MOLA": return "Colchão de mola";
            case "BICAMA": return "Bicama";
            default: return tipo;
        }

    }
}
