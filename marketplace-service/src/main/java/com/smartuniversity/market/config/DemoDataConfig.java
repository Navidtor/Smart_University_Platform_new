package com.smartuniversity.market.config;

import com.smartuniversity.market.domain.Product;
import com.smartuniversity.market.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.math.BigDecimal;
import java.util.UUID;

@Configuration
@Profile("demo")
public class DemoDataConfig {

    @Bean
    CommandLineRunner marketplaceDemoData(ProductRepository productRepository) {
        return args -> {
            if (productRepository.count() > 0) {
                return;
            }
            String tenantId = "engineering";
            UUID demoTeacherId = UUID.randomUUID();

            Product notebook = new Product();
            notebook.setTenantId(tenantId);
            notebook.setSellerId(demoTeacherId);
            notebook.setName("Campus Notebook");
            notebook.setDescription("A5 ruled notebook with university logo");
            notebook.setPrice(BigDecimal.valueOf(5.00));
            notebook.setStock(100);

            Product textbook = new Product();
            textbook.setTenantId(tenantId);
            textbook.setSellerId(demoTeacherId);
            textbook.setName("Algorithms Textbook");
            textbook.setDescription("Core algorithms and data structures");
            textbook.setPrice(BigDecimal.valueOf(50.00));
            textbook.setStock(20);

            productRepository.save(notebook);
            productRepository.save(textbook);
        };
    }
}