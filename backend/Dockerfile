# Estágio 1: Build da aplicação usando Maven
FROM maven:3.8.8-eclipse-temurin-17 AS build
WORKDIR /app

# Copia os arquivos de dentro da pasta backend para o container
COPY backend/pom.xml .
COPY backend/src ./src

# Executa o build do Maven
RUN mvn clean package -DskipTests

# Estágio 2: Execução da aplicação
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copia o .jar gerado no primeiro estágio
COPY --from=build /app/target/*-runner.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]