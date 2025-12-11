package com.smartuniversity.market.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Redis caching configuration for the Marketplace service.
 * 
 * This configuration provides:
 * - Distributed caching across service instances
 * - TTL (Time-To-Live) configuration per cache
 * - JSON serialization for cached objects
 * 
 * Cache Names:
 * - productsByTenant: Caches product listings per tenant (10 min TTL)
 * 
 * Note: This config is disabled during tests (profile "!test") to use simple in-memory cache instead.
 */
@Configuration
@Profile("!test")
public class RedisConfig implements CachingConfigurer {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // Default cache configuration
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));

        // Per-cache TTL configuration
        Map<String, RedisCacheConfiguration> cacheConfigs = new HashMap<>();
        
        // Products cache: 10 minutes TTL (products don't change frequently)
        cacheConfigs.put("productsByTenant", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        
        // Orders cache: 5 minutes TTL (orders may change more frequently)
        cacheConfigs.put("ordersByTenant", defaultConfig.entryTtl(Duration.ofMinutes(5)));
        
        // Single product cache: 15 minutes TTL
        cacheConfigs.put("productById", defaultConfig.entryTtl(Duration.ofMinutes(15)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigs)
                .transactionAware()
                .build();
    }
}
