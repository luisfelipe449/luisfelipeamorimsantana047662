package com.pss.fullstack.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("PSS Fullstack API - Artistas e Álbuns")
                        .description("API REST para gerenciamento de artistas e álbuns - " +
                                "Projeto Full Stack para o Processo Seletivo Simplificado nº 001/2026/SEPLAG")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Candidato")
                                .email("candidato@email.com"))
                        .license(new License()
                                .name("Projeto de Avaliação")
                                .url("https://seletivo.seplag.mt.gov.br")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                                .name(securitySchemeName)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("JWT token de autenticação. Obtenha em /api/v1/auth/login")));
    }

}
