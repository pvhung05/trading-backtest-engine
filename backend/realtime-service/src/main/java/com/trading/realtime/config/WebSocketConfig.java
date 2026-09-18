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
		// Pure WebSocket for raw WebSocket clients, Postman WS, and Spring Cloud Gateway proxying
		registry.addEndpoint("/ws/market")
				.setAllowedOriginPatterns("*");

		// SockJS fallback for browser clients using SockJS emulation
		registry.addEndpoint("/ws/market")
				.setAllowedOriginPatterns("*")
				.withSockJS();
		log.info("WebSocket STOMP endpoints registered: /ws/market (Raw WS & SockJS)");
	}

	@Override
	public void configureWebSocketTransport(org.springframework.web.socket.config.annotation.WebSocketTransportRegistration registry) {
		registry.setMessageSizeLimit(10 * 1024 * 1024);
		registry.setSendBufferSizeLimit(20 * 1024 * 1024);
		registry.setSendTimeLimit(20000);
	}
}
