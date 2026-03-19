package com.programaGestao.resource;

import com.programaGestao.model.Usuario;
import com.programaGestao.model.RecuperacaoSenha;

import com.programaGestao.dto.LoginDTO;
import com.programaGestao.dto.UserDTO;
import com.programaGestao.dto.RedefinirSenhaRequest;
import com.programaGestao.dto.CodigoRequest;
import com.programaGestao.dto.EmailRequest;

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.inject.Inject;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import org.mindrot.jbcrypt.BCrypt;
import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import java.time.LocalDateTime;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)

public class AuthResource {
    
    @POST
    @Path("/registro")
    @Transactional

    public Response registrar(@Valid UserDTO dto) {
        
        if (Usuario.find("email", dto.email).count() > 0) {
            return Response.status(Response.Status.CONFLICT).entity("Email já cadastrado").build();
        }

        Usuario usuario = new Usuario();
        usuario.nome = dto.nome;
        usuario.email = dto.email;

        String hashed = BCrypt.hashpw(dto.senha, BCrypt.gensalt());
        usuario.senha = hashed;

        usuario.persist();
        return Response.ok(usuario).build();
    }

    @POST
    @Path("/login")
    @Transactional

    public Response login(@Valid LoginDTO dto) {

        Usuario usuario = Usuario.find("email", dto.email).firstResult();

        if (usuario == null || !BCrypt.checkpw(dto.senha, usuario.senha)) {
            return Response.status(Response.Status.UNAUTHORIZED).entity("Email ou senha inválidos").build();
        }

        return Response.ok(usuario).build();
    }
    

    @Inject
    Mailer mailer;

    @POST
    @Path("/esqueci-senha")
    @Transactional

    public Response esqueciSenha(@Valid EmailRequest request) {

        Usuario usuario = Usuario.find("email", request.email).firstResult();

        if (usuario == null) {
            return Response.ok("Se o email existir, você receberá um código").build();
        }

        RecuperacaoSenha.update("utilizado = true where usuario = ?1 and utilizado = false", usuario);

        RecuperacaoSenha recuperacao = new RecuperacaoSenha();
        recuperacao.usuario = usuario;
        recuperacao.codigo = RecuperacaoSenha.gerarCodigo();
        recuperacao.expiracao = LocalDateTime.now().plusMinutes(15);
        recuperacao.utilizado = false;

        recuperacao.persist();

        String html = gerarTemplateEmail(recuperacao.codigo, usuario.nome);
        mailer.send(Mail.withHtml(usuario.email, "Recuperação de senha", html));

        return Response.ok("Se o email existir, você receberá um código").build();

    }

    @POST
    @Path("/verificar-codigo")
    @Transactional

    public Response verificarCodigo(@Valid CodigoRequest request) {

        Usuario usuario = Usuario.find("email", request.email).firstResult();

        if (usuario == null) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Código inválido ou expirado").build();
        }

        RecuperacaoSenha recuperacao = RecuperacaoSenha.find("usuario = ?1 and codigo = ?2 and utilizado = false and expiracao > ?3",
            usuario, request.codigo, LocalDateTime.now()
        ).firstResult();

        if (recuperacao == null) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Código inválido ou expirado").build();
        }

        return Response.ok("Código válido").build();

    }

    @POST
    @Path("/redefinir-senha")
    @Transactional

    public Response redefinirSenha(@Valid RedefinirSenhaRequest request) {

        Usuario usuario = Usuario.find("email", request.email).firstResult();

        if (usuario == null) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Código inválido ou expirado").build();
        }

        RecuperacaoSenha recuperacao = RecuperacaoSenha.find("usuario = ?1 and codigo = ?2 and utilizado = false and expiracao > ?3",
            usuario, request.codigo, LocalDateTime.now()
        ).firstResult();

        if (recuperacao == null) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Código inválido ou expirado").build();
        }

        String hashed = BCrypt.hashpw(request.novaSenha, BCrypt.gensalt());
        usuario.senha = hashed;
        usuario.persist();

        recuperacao.utilizado = true;
        recuperacao.persist();

        return Response.ok("Senha alterada com sucesso").build();
        
    }

    @GET 
    @Path("/usuarios")

    public Response listar() {
        var usuarios = Usuario.listAll();
        usuarios.forEach(u -> ((Usuario) u).senha = null);
        return Response.ok(usuarios).build();
    }

    private String gerarTemplateEmail(String codigo, String nome) {
        
        return String.format("""
           
            <!DOCTYPE html>
            <html>
            
            <head>
                
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                
                <style>
                
                    body { 
                        font-family: 'Poppins', sans-serif; 
                        background: #f4f4f4; 
                        margin: 0;
                        padding: 20px; 
                    }

                    .container { 
                        max-width: 600px; 
                        background: white; 
                        padding: 40px; 
                        border-radius: 16px; 
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
                        margin: 0 auto; 
                    }

                    .logo { 
                        color: #02323C;
                        font-size: 28px; 
                        font-weight: 700; 
                        text-align: center; 
                        margin-bottom: 30px; 
                        letter-spacing: -0.5px;
                    }

                    h2 {
                        color: #02323C;
                        font-weight: 600;
                        font-size: 24px;
                        margin-bottom: 20px;
                    }

                    p {
                        color: #02323C;
                        font-size: 16px;
                        line-height: 1.6;
                        margin: 16px 0;
                    }

                    .code { 
                        font-size: 48px; 
                        font-weight: 700; 
                        color: #02323C; 
                        text-align: center; 
                        margin: 30px 0; 
                        padding: 20px; 
                        background: #A1F0C0;
                        border-radius: 12px; 
                        letter-spacing: 8px;
                    }

                    .info { 
                        background: #E0F7FF; 
                        padding: 20px; 
                        border-radius: 12px; 
                        margin: 25px 0; 
                    }

                    .info p {
                        margin: 8px 0;
                        color: #02323C;
                    }

                    .footer { 
                        margin-top: 40px; 
                        font-size: 14px; 
                        text-align: center; 
                        padding-top: 25px;
                    }

                    .footer p {
                        margin: 4px 0;
                        font-size: 13px;
                    }

                </style>
            </head>
           
            <body>
                
                <div class="container">
                    
                    <div class="logo">🌵 Programa de gestão </div>
                    
                    <h2>Recuperação de senha</h2>
                    
                    <p>Olá <strong>%s</strong>, tudo bem?</p>
                    
                    <p>Recebemos uma solicitação de recuperação de senha para sua conta. Para continuar, utilize o código abaixo:</p>
                    
                    <div class="code">%s</div>
                    
                    <div class="info">
                        <p>⏱️ <strong>Válido por 15 minutos</strong></p>
                        <p>🔒 <strong>Não compartilhe</strong> este código com ninguém</p>
                        <p>Este é um procedimento de segurança</p>
                    </div>
                    
                    <p>Se você não solicitou esta recuperação, pode ignorar este email.</p>
                    
                    <div class="footer">
                        <p>Programa de gestão • Controle financeiro da sua loja</p>
                        <p>Desenvolvido por Ravi Soares</p>
                    </div>
                </div>
            </body>
            </html>
            """, nome, codigo);
    }
 }
