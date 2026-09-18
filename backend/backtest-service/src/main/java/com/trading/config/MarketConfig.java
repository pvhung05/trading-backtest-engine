package com.trading.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trading.service.market.MarketDataCache;

/**
 * Spring configuration for the market module.
 * Registers beans required for market data operations.
 *
 * @author Trading System
 */
@Configuration
public class MarketConfig {

    /**
     * Creates a RestTemplate bean for HTTP calls.
     * Configured with default settings for API communication.
     *
     * @return configured RestTemplate
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    /**
     * Creates an ObjectMapper bean for JSON serialization/deserialization.
     *
     * @return configured ObjectMapper
     */
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        mapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        return mapper;
    }

    /**
     * Creates a MarketDataCache bean.
     * Singleton bean for caching market data across the application.
     *
     * @return new MarketDataCache instance
     */
    @Bean
    public MarketDataCache marketDataCache() {
        return new MarketDataCache();
    }
}
