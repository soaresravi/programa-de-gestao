FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

FROM openjdk:25-slim AS build-env
WORKDIR /app

COPY --from=build /usr/share/maven /usr/share/maven
COPY --from=build /usr/bin/mvn /usr/bin/mvn

RUN ln -s /usr/share/maven/bin/mvn /usr/bin/mvn

COPY backend/pom.xml .
COPY backend/src ./src

RUN mvn clean package -DskipTests

FROM openjdk:25-slim
WORKDIR /app

COPY --from=build-env /app/target/quarkus-app/ /app/

EXPOSE 8080
CMD ["java", "-jar", "quarkus-run.jar"]