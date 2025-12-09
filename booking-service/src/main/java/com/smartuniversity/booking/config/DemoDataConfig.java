package com.smartuniversity.booking.config;

import com.smartuniversity.booking.domain.Resource;
import com.smartuniversity.booking.repository.ResourceRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("demo")
public class DemoDataConfig {

    @Bean
    CommandLineRunner bookingDemoData(ResourceRepository resourceRepository) {
        return args -> {
            if (resourceRepository.count() > 0) {
                return;
            }
            Resource room101 = new Resource();
            room101.setTenantId("engineering");
            room101.setName("Room 101");
            room101.setType("CLASSROOM");
            room101.setCapacity(30);

            Resource labA = new Resource();
            labA.setTenantId("engineering");
            labA.setName("Lab A");
            labA.setType("LAB");
            labA.setCapacity(20);

            resourceRepository.save(room101);
            resourceRepository.save(labA);
        };
    }
}