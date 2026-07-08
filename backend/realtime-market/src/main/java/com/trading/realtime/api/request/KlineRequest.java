package com.trading.realtime.api.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for fetching historical kline/candlestick data.
 * Used for chart initialization and lazy loading.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KlineRequest {

	@NotBlank(message = "Symbol is required")
	private String symbol;

	@NotBlank(message = "Interval is required")
	private String interval;

	@Min(value = 1, message = "Limit must be at least 1")
	@Max(value = 1500, message = "Limit cannot exceed 1500")
	@Builder.Default
	private Integer limit = 500;

	private Long startTime;

	private Long endTime;
}
