# Estágio 1: Build da aplicação usando Maven
FROM maven:3.8.8-eclipse-temurin-17 AS build
WORKDIR /app

# Como o Render já entra na pasta backend (por causa do Root Directory),
# nós copiamos os arquivos direto do diretório atual do build.
COPY pom.xml .
COPY src ./src

# Executa o build do Maven
RUN mvn clean package -DskipTests

# Estágio 2: Execução da aplicação
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copia o .jar gerado no primeiro estágio
COPY --from=build /app/target/*-runner.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]