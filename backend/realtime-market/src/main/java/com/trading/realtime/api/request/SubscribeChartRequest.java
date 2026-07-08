package com.trading.realtime.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for subscribing to a chart's real-time kline stream.
 * Sent from frontend when opening a chart.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscribeChartRequest {

	@NotBlank(message = "Symbol is required")
	private String symbol;

	@NotBlank(message = "Interval is required")
	private String interval;
}
