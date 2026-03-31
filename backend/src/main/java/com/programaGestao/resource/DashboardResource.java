package com.programaGestao.resource;

import com.programaGestao.model.*;

import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Path("/dashboard")
@RolesAllowed("user")

@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)

public class DashboardResource {

    private LocalDate[] getDatasPadrao() {
        
        LocalDate inicio = LocalDate.now().withDayOfMonth(1);
        LocalDate fim = LocalDate.now();

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
        
        double totalCustoProducao = vendas.stream().mapToDouble(v -> {

            double custo = 0;

            if (v.itens != null) {
                custo = v.itens.stream().mapToDouble(i -> i.quantidade * (i.custoUnitario != null ? i.custoUnitario : 0)).sum();
            }

            return custo;

        }).sum();

        double despesasLoja = Despesa.<Despesa>find("tipo = 'LOJA' and dataVencimento between ?1 and ?2", dataInicio, dataFim).stream().mapToDouble(d -> d.valor != null ? d.valor : 0).sum();
        double despesasCasa = Despesa.<Despesa>find("tipo = 'CASA' and dataVencimento between ?1 and ?2", dataInicio, dataFim).stream().mapToDouble(d -> d.valor != null ? d.valor : 0).sum();
       
        double lucroLiquido = totalReceitas - totalCustoProducao - despesasLoja;

        Map<String, Object> resumo = new HashMap<>();

        resumo.put("totalReceitas", totalReceitas);
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

        double gastosCasa = Despesa.<Despesa>find("tipo = 'CASA' and dataVencimento between ?1 and ?2", dataInicio, dataFim).stream().mapToDouble(d -> d.valor != null ? d.valor : 0).sum();
        double gastosLoja = Despesa.<Despesa>find("tipo = 'LOJA' and dataVencimento between ?1 and ?2", dataInicio, dataFim).stream().mapToDouble(d -> d.valor != null ? d.valor : 0).sum();

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
    @Path("/produtos-top")

    public Response getProdutosTop(@QueryParam("dataInicio") LocalDate dataInicio, @QueryParam("dataFim") LocalDate dataFim) {

        if (dataInicio == null || dataFim == null) {
           
            LocalDate[] padrao = getDatasPadrao();
            
            dataInicio = padrao[0];
            dataFim = padrao[1];
        
        }

        List<Venda> vendas = Venda.find("data between ?1 and ?2", dataInicio, dataFim).list();

        Map<Long, Double> lucroPorProduto = new HashMap<>();
        Map<Long, String> nomePorProduto = new HashMap<>();

        for (Venda v : vendas) {

            if (v.itens != null) {

                for (ItemVenda i : v.itens) {

                    if (i.produto != null) {
                        Long id = i.produto.id;
                        double lucro = (i.precoUnitario != null ? i.precoUnitario : 0) - (i.custoUnitario != null ? i.custoUnitario : 0);
                        lucroPorProduto.merge(id, lucro * i.quantidade, Double::sum);
                        nomePorProduto.putIfAbsent(id, i.produto.nome);
                    }

                }
            }
        }

        List<Map<String, Object>> ranking = new ArrayList<>();

        for (Map.Entry<Long, Double> entry : lucroPorProduto.entrySet()) {

            Map<String, Object> item = new HashMap<>();

            item.put("id", entry.getKey());
            item.put("nome", nomePorProduto.get(entry.getKey()));
            item.put("lucro", entry.getValue());

            ranking.add(item);

        }

        ranking.sort((a, b) -> Double.compare((Double) b.get("lucro"), (Double) a.get("lucro")));
        return Response.ok(ranking.stream().limit(5).collect(Collectors.toList())).build();

    }

    @GET
    @Path("/produtos-flop")

    public Response getProdutosFlop(@QueryParam("dataInicio") LocalDate dataInicio, @QueryParam("dataFim") LocalDate dataFim) {

        if (dataInicio == null || dataFim == null) {
           
            LocalDate[] padrao = getDatasPadrao();
        
            dataInicio = padrao[0];
            dataFim = padrao[1];
        
        }

        List<Venda> vendas = Venda.find("data between ?1 and ?2", dataInicio, dataFim).list();

        Map<Long, Double> lucroPorProduto = new HashMap<>();
        Map<Long, String> nomePorProduto = new HashMap<>();

        for (Venda v : vendas) {

            if (v.itens != null) {

                for (ItemVenda i : v.itens) {

                    if (i.produto != null) {
                        Long id = i.produto.id;
                        double lucro = (i.precoUnitario != null ? i.precoUnitario : 0) - (i.custoUnitario != null ? i.custoUnitario : 0);
                        lucroPorProduto.merge(id, lucro * i.quantidade, Double::sum);
                        nomePorProduto.putIfAbsent(id, i.produto.nome);
                    }

                }
            }
            
        }

        List<Map<String, Object>> ranking = new ArrayList<>();

        for (Map.Entry<Long, Double> entry : lucroPorProduto.entrySet()) {

            Map<String, Object> item = new HashMap<>();

            item.put("id", entry.getKey());
            item.put("nome", nomePorProduto.get(entry.getKey()));
            item.put("lucro", entry.getValue());

            ranking.add(item);

        }

        ranking.sort((a, b) -> Double.compare((Double) a.get("lucro"), (Double) b.get("lucro")));

        return Response.ok(ranking.stream().limit(5).collect(Collectors.toList())).build();

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
    @Produces("application/pdf")

    public Response exportarPDF(@QueryParam("dataInicio") LocalDate dataInicio, @QueryParam("dataFim") LocalDate dataFim) {
        
        if (dataInicio == null || dataFim == null) {

            LocalDate[] padrao = getDatasPadrao();

            dataInicio = padrao[0];
            dataFim = padrao[1];

        }

        List<Venda> vendas = Venda.find("data between ?1 and ?2", dataInicio, dataFim).list();

        List<Despesa> despesasLoja = Despesa.find("tipo = 'LOJA' and dataVencimento between ?1 and ?2", dataInicio, dataFim).list();
        List<Despesa> despesasCasa = Despesa.find("tipo = 'CASA' and dataVencimento between ?1 and ?2", dataInicio, dataFim).list();

        double totalReceitas = vendas.stream().mapToDouble(v -> v.valorTotal != null ? v.valorTotal : 0).sum();

        double totalCusto = vendas.stream().mapToDouble(v -> {

            double custo = 0;

            if (v.itens != null) {
                custo = v.itens.stream().mapToDouble(i -> i.quantidade * (i.custoUnitario != null ? i.custoUnitario : 0)).sum();
            }

            return custo;

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

        Map<Long, Double> lucroPorProduto = new HashMap<>();
        Map<Long, String> nomePorProduto = new HashMap<>();

        for (Venda v : vendas) {

            if (v.itens != null) {

                for (ItemVenda i : v.itens) {

                    if (i.produto != null) {
                        Long id = i.produto.id;
                        double lucro = (i.precoUnitario != null ? i.precoUnitario : 0) - (i.custoUnitario != null ? i.custoUnitario : 0);
                        lucroPorProduto.merge(id, lucro * i.quantidade, Double::sum);
                        nomePorProduto.putIfAbsent(id, i.produto.nome);
                    }

                }
            }
        }

        List<Map<String, Object>> produtosTop = new ArrayList<>();
        List<Map<String, Object>> produtosFlop = new ArrayList<>();

        for (Map.Entry<Long, Double> entry : lucroPorProduto.entrySet()) {

            Map<String, Object> item = new HashMap<>();

            item.put("nome", nomePorProduto.get(entry.getKey()));
            item.put("lucro", entry.getValue());

            produtosTop.add(item);
            produtosFlop.add(item);

        }

        produtosTop.sort((a, b) -> Double.compare((Double) b.get("lucro"), (Double) a.get("lucro")));
        produtosFlop.sort((a, b) -> Double.compare((Double) a.get("lucro"), (Double) b.get("lucro")));
        
        produtosTop = produtosTop.stream().limit(5).collect(Collectors.toList());
        produtosFlop = produtosFlop.stream().limit(5).collect(Collectors.toList());

        Map<Long, Double> totalGastosLojistas = new HashMap<>();
        Map<Long, String> nomeLojista = new HashMap<>();

        for (Venda v : vendas) {

            if (v.lojista != null) {
                Long id = v.lojista.id;
                totalGastosLojistas.merge(id, v.valorTotal != null ? v.valorTotal : 0, Double::sum);
                nomeLojista.putIfAbsent(id, v.lojista.nome);
            }

        }

        List<Map<String, Object>> rankingLojistas = new ArrayList<>();

        for (Long id : totalGastosLojistas.keySet()) {
            
            Map<String, Object> item = new HashMap<>();

            item.put("nome", nomeLojista.get(id));
            item.put("totalGasto", totalGastosLojistas.get(id));
            
            rankingLojistas.add(item);

        }

        rankingLojistas.sort((a, b) -> Double.compare((Double) b.get("totalGasto"), (Double) a.get("totalGasto") ));

        Map<String, Double> totalVendido = new HashMap<>();
        Map<String, Double> totalLucroVendedor = new HashMap<>();

        for (Venda v : vendas) {
            
            if (v.vendedor != null && !v.vendedor.trim().isEmpty()) {
                String vendedor = v.vendedor;
                totalVendido.merge(vendedor, v.valorTotal != null ? v.valorTotal : 0, Double::sum);
                totalLucroVendedor.merge(vendedor, v.lucroBruto != null ? v.lucroBruto : 0, Double::sum);
            }

        }

        List<Map<String, Object>> rankingVendedores = new ArrayList<>();

        for (String vendedor : totalVendido.keySet()) {

            Map<String, Object> item = new HashMap<>();

            item.put("vendedor", vendedor);
            item.put("totalVendido", totalVendido.get(vendedor));
            item.put("totalLucro", totalLucroVendedor.get(vendedor));

            rankingVendedores.add(item);

        }

        rankingVendedores.sort((a, b) -> Double.compare((Double) b.get("totalVendido"), (Double) a.get("totalVendido")));

        String html = gerarHtmlRelatorio(dataInicio, dataFim, totalReceitas, totalCusto, despesasLojaTotal, despesasCasaTotal, lucroLiquido,
        lucroPorTipo, quantidadePorTipo, vendasLojaFisica, vendasOutros, vendas.size(), lucroClienteFinal, lucroLojista, produtosTop, produtosFlop, rankingLojistas, rankingVendedores);

        return Response.ok(html).type(MediaType.TEXT_HTML).build();

    }

    private String gerarHtmlRelatorio(LocalDate dataInicio, LocalDate dataFim, double totalReceitas, double totalCusto, double despesasLoja,
    
    double despesasCasa, double lucroLiquido, Map<String, Double> lucroPorTipo, Map<String, Integer> quantidadePorTipo, double vendasLojaFisica,
    double vendasOutros, int totalVendas, double lucroClienteFinal, double lucroLojista, List<Map<String, Object>> produtosTop, List<Map<
    String, Object>> produtosFlop, List<Map<String, Object>> rankingLojistas, List<Map<String, Object>> rankingVendedores) {
    
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        StringBuilder html = new StringBuilder();

        html.append("<!DOCTYPE html>");
        html.append("<html><head>");
        html.append("<meta charset='UTF-8'>");
        html.append("<title>Relatório Dashboard</title>");
        html.append("<style>");
        html.append("body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; background: #f5f5f5; }");
        html.append(".container { max-width: 1400px; margin: 0 auto; background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }");
        html.append("h1 { color: #14532d; border-left: 5px solid #22c55e; padding-left: 20px; margin-bottom: 10px; font-size: 24px; }");
        html.append("h2 { color: #166534; font-size: 18px; margin-top: 0; margin-bottom: 20px; }");
        html.append("h3 { color: #14532d; margin-top: 25px; margin-bottom: 10px; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }");
        html.append(".header-info { background: #f0fdf4; padding: 12px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; flex-wrap: wrap; }");
        html.append(".summary { display: flex; gap: 12px; margin-bottom: 25px; flex-wrap: wrap; }");
        html.append(".summary-card { background: #f0fdf4; border-radius: 10px; padding: 12px 15px; flex: 1; min-width: 130px; text-align: center; border: 1px solid #bbf7d0; }");
        html.append(".summary-card h4 { margin: 0 0 5px 0; color: #166534; font-size: 12px; font-weight: normal; }");
        html.append(".summary-card .value { font-size: 20px; font-weight: bold; color: #14532d; }");
        html.append("table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }");
        html.append("th { background-color: #14532d; color: white; padding: 8px; text-align: left; }");
        html.append("td { border: 1px solid #ddd; padding: 8px; }");
        html.append("tr:nth-child(even) { background-color: #f9fafb; }");
        html.append(".footer { margin-top: 25px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #e5e7eb; padding-top: 15px; }");
        html.append(".grid-2 { display: flex; gap: 20px; margin-top: 20px; }");
        html.append(".grid-2 > div { flex: 1; }");
        html.append("</style>");
        html.append("</head><body>");
        html.append("<div class='container'>");
    
        html.append("<h1>📊 PROGRAMA DE GESTÃO - DAVID COLCHÕES</h1>");
        html.append("<h2>Relatório do Dashboard</h2>");
    
        html.append("<div class='header-info'>");
        html.append("<div><strong> Período: </strong> ").append(dataInicio.format(fmt)).append(" a ").append(dataFim.format(fmt)).append("</div>");
        html.append("<div><strong> Gerado em: </strong>").append(LocalDate.now().format(fmt)).append("</div>");
        html.append("</div>");

        html.append("<div class='summary'>");
        html.append("<div class='summary-card'><h4> Receita total </h4><div class='value'> R$ ").append(String.format("%,.2f", totalReceitas)).append("</div></div>");
        html.append("<div class='summary-card'><h4> Custo total </h4><div class='value'> R$ ").append(String.format("%,.2f", totalCusto)).append("</div></div>");
        html.append("<div class='summary-card'><h4> Despesas loja </h4><div class='value'> R$ ").append(String.format("%,.2f", despesasLoja)).append("</div></div>");
        html.append("<div class='summary-card'><h4> Despesas casa </h4><div class='value'> R$ ").append(String.format("%,.2f", despesasCasa)).append("</div></div>");
        html.append("<div class='summary-card'><h4> Lucro líquido </h4><div class='value'> R$ ").append(String.format("%,.2f", lucroLiquido)).append("</div></div>");
        html.append("</div>");

        html.append("<h3>Desempenho por tipo de produto</h3>");
        html.append("  \n");
        html.append("<thead><th>Tipo</th><th>Quantidade</th><th>Lucro Total</th></thead><tbody>");

        for (Map.Entry<String, Double> entry : lucroPorTipo.entrySet()) {

            String tipo = entry.getKey();
            double lucro = entry.getValue();
            int quantidade = quantidadePorTipo.getOrDefault(tipo, 0);

            html.append("<tr><td>").append(formatarTipoProduto(tipo)).append("</td>");
            html.append("<td>").append(quantidade).append(" un</td>");
            html.append("<td>R$ ").append(String.format("%,.2f", lucro)).append("</td></tr>");

        }

        html.append("</tbody>");
        html.append("</table>");

        html.append("<div class='grid-2'>");
        
        html.append("<div>");
        html.append("<h3> Origem das vendas</h3>");
        html.append("<table><thead><th>Origem</th><th>Valor</th><th>%</th></thead><tbody>");

        double percentualLoja = totalReceitas > 0 ? (vendasLojaFisica / totalReceitas) * 100 : 0;
        double percentualOutros = totalReceitas > 0 ? (vendasOutros / totalReceitas) * 100 : 0;

        html.append("<tr><td> Loja física </td><td> R$ ").append(String.format("%,.2f", vendasLojaFisica)).append("</td><td>").append(String.format("%.1f", percentualLoja)).append("%</td</tr>");
        html.append("<tr><td> WhatsApp </td><td> R$ ").append(String.format("%,.2f", vendasOutros)).append("</td><td>").append(String.format("%.1f", percentualOutros)).append("%</td></tr>");
        html.append("</tbody></table>");
        html.append("</div>");
        
        html.append("<div>");
        html.append("<h3>Cliente vs lojista</h3>");
        html.append("<table><thead><th>Tipo</th><th>Lucro Total</th></thead><tbody>");
        html.append("<tr><td> Cliente </td><td> R$ ").append(String.format("%,.2f", lucroClienteFinal)).append("</td></tr>");
        html.append("<tr><td> Lojista </td><td> R$ ").append(String.format("%,.2f", lucroLojista)).append("</td></tr>");
        html.append("</tbody></table>");
        html.append("</div>");
        
        html.append("</div>");

        html.append("<div class='grid-2'>");
        
        html.append("<div>");
        html.append("<h3>Produtos que mais lucram (Top 5)</h3>");
        html.append("<table><thead><th>Produto</th><th>Lucro</th></thead><tbody>");

        for (Map<String, Object> p : produtosTop) {
            html.append("<tr><td>").append(p.get("nome")).append("</td><td> R$ ").append(String.format("%,.2f", p.get("lucro"))).append("</td></tr>");
        }

        html.append("</tbody></table>");
        html.append("</div>");
    
        html.append("<div>");
        html.append("<h3> Produtos que menos lucram (Top 5)</h3>");
        html.append("<table><thead><th>Produto</th><th>Lucro</th></thead><tbody>");

        for (Map<String, Object> p : produtosFlop) {
            html.append("<tr><td>").append(p.get("nome")).append("</td><td> R$ ").append(String.format("%,.2f", p.get("lucro"))).append("</td></tr>");
        }

        html.append("</tbody></table>");
        html.append("</div>");
        
        html.append("</div>");
    
        html.append("<div class='grid-2'>");
        
        html.append("<div>");
        html.append("<h3>🏪 Ranking lojistas (mais compram)</h3>");
        html.append("<table><thead><th>Lojista</th><th>Total Gasto</th></thead><tbody>");

        for (Map<String, Object> l : rankingLojistas) {
            html.append("<tr><td>").append(l.get("nome")).append("</td><td> R$ ").append(String.format("%,.2f", l.get("totalGasto"))).append("</td></tr>");
        }

        html.append("</tbody></table>");
        html.append("</div>");
    
        html.append("<div>");
        html.append("<h3>Ranking vendedores (mais vendem)</h3>");
        html.append("<table><thead><th>Vendedor</th><th>Total Vendido</th><th>Lucro Gerado</th></thead><tbody>");

        for (Map<String, Object> v : rankingVendedores) {
            html.append("<tr><td>").append(v.get("vendedor")).append("</td>");
            html.append("<td> R$ ").append(String.format("%,.2f", v.get("totalVendido"))).append("</td>");
            html.append("<td> R$ ").append(String.format("%,.2f", v.get("totalLucro"))).append("</td></tr>");
        }

        html.append("</tbody></table>");
        html.append("</div>");
        
        html.append("</div>");
    
        html.append("<h3>Resumo do período</h3>");
        html.append("<table><thead><th>Indicador</th><th>Valor</th></thead><tbody>");
        html.append("<tr><td>Total de vendas</td><td>").append(totalVendas).append(" vendas</td></tr>");
        html.append("<tr><td>Ticket médio</td><td> R$ ").append(String.format("%,.2f", totalVendas > 0 ? totalReceitas / totalVendas : 0)).append("</td></tr>");
        html.append("<tr><td> Margem de lucro</td><td>").append(String.format("%.1f", totalReceitas > 0 ? (lucroLiquido / totalReceitas) * 100 : 0)).append("%</td></tr>");
        html.append("</tbody></table>");

        html.append("<div class='footer'>");
        html.append("Desenvolvido por Ravi Soares - David Colchões");
        html.append("</div>");
        html.append("</div>");
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
