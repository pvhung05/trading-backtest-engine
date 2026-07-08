package com.trading.realtime.client.rest.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Raw DTO for Binance API error responses.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BinanceErrorResponse {
	private int code;
	private String msg;
}
