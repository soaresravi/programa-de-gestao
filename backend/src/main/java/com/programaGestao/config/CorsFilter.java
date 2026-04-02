package com.programaGestao.config;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;
import java.io.IOException;

@Provider

public class CorsFilter implements ContainerResponseFilter { //to handle cors configuration

    @Override
    
    public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext) throws IOException {
        responseContext.getHeaders().add("Access-Control-Allow-Origin", "http://localhost:5173"); // allows requests from the frontend api
        responseContext.getHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD"); //http methods allowed when accessing the resource
        responseContext.getHeaders().add("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, X-Requested-With"); //http headers can be used during request
        responseContext.getHeaders().add("Access-Control-Allow-Credentials", "true"); //allows the browser send cookies to the server
    }
}