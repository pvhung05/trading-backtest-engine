package com.trading.realtime.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.web.socket.client.WebSocketClient;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * General application configuration.
 * Configures WebSocket client and Jackson ObjectMapper.
 */
@Configuration
public class AppConfig {

	/**
	 * Creates a standard Java WebSocket client for connecting to Binance.
	 *
	 * @return the WebSocket client instance
	 */
	@Bean
	public WebSocketClient webSocketClient() {
		return new StandardWebSocketClient();
	}

	/**
	 * Configures Jackson ObjectMapper with Java 8 time module support.
	 *
	 * @return configured ObjectMapper
	 */
	@Bean
	public ObjectMapper objectMapper() {
		ObjectMapper mapper = new ObjectMapper();
		mapper.registerModule(new JavaTimeModule());
		mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
		return mapper;
	}
}
