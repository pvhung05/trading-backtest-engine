package com.trading.realtime.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration for STOMP messaging.
 * Enables a message broker for pub/sub communication between server and frontend.
 */
@Slf4j
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

	/**
	 * Configures the message broker for sending and receiving messages.
	 * - /topic: Used for broadcasting to multiple subscribers (pub/sub)
	 * - /queue: Used for point-to-point messaging
	 *
	 * @param config the message broker registry
	 */
	@Override
	public void configureMessageBroker(MessageBrokerRegistry config) {
		config.enableSimpleBroker("/topic", "/queue");
		config.setApplicationDestinationPrefixes("/app");
		config.setUserDestinationPrefix("/user");
		log.info("WebSocket message broker configured with /topic and /queue prefixes");
	}

	/**
	 * Registers STOMP endpoints that frontend clients connect to.
	 * - /ws/market: Main WebSocket endpoint for market data
	 *
	 * @param registry the STOMP endpoint registry
	 */
	@Override
	public void registerStompEndpoints(StompEndpointRegistry registry) {
		registry.addEndpoint("/ws/market")
				.setAllowedOriginPatterns("*")
				.withSockJS();
		log.info("WebSocket STOMP endpoint registered: /ws/market");
	}
}
