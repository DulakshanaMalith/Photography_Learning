package com.plp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@SpringBootApplication
@EnableMongoAuditing
public class PhotographyLearningPlatformApplication {
    public static void main(String[] args) {
        SpringApplication.run(PhotographyLearningPlatformApplication.class, args);
    }
}