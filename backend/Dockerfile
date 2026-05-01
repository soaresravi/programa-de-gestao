# Estágio 1: Build da aplicação usando Maven com Java 21
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copia os arquivos de dentro da pasta backend para o container
COPY backend/pom.xml .
COPY backend/src ./src

# Executa o build do Maven
RUN mvn clean package -DskipTests

# Estágio 2: Execução da aplicação com Java 21
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copia a pasta gerada pelo Quarkus no primeiro estágio
COPY --from=build /app/target/quarkus-app/ /app/

EXPOSE 8080
CMD ["java", "-jar", "quarkus-run.jar"]