package com.trading.realtime;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main entry point for the Realtime Market Service.
 * This microservice acts as a gateway between the Frontend and Binance API,
 * providing REST and WebSocket endpoints for real-time market data.
 */
@SpringBootApplication
@EnableScheduling
public class RealtimeMarketApplication {

	public static void main(String[] args) {
		SpringApplication.run(RealtimeMarketApplication.class, args);
	}
}
