package com.programaGestao.dto;

import com.programaGestao.model.Venda;
import java.util.List;

public class VendaPaginadaDTO {

    public List<Venda> content; 
    public long totalElements;
    public int totalPages;      
    public int currentPage;    

    public VendaPaginadaDTO(List<Venda> content, long totalElements, int totalPages, int currentPage) {
        this.content = content;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.currentPage = currentPage;
    }
    
}