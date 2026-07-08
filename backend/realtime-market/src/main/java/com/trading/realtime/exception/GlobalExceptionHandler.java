package com.trading.realtime.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for REST and WebSocket errors.
 * Provides consistent error response format across all endpoints.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

	/**
	 * Standard error response format.
	 */
	public record ErrorResponse(
			int status,
			String error,
			String message,
			String path,
			long timestamp
	) {
		public static ErrorResponse of(HttpStatus status, String message, String path) {
			return new ErrorResponse(
					status.value(),
					status.getReasonPhrase(),
					message,
					path,
					Instant.now().toEpochMilli()
			);
		}
	}

	/**
	 * Handles Binance API exceptions.
	 */
	@ExceptionHandler(BinanceApiException.class)
	public ResponseEntity<ErrorResponse> handleBinanceApiException(BinanceApiException ex) {
		log.error("Binance API error: {}", ex.getMessage());
		return ResponseEntity
				.status(HttpStatus.BAD_GATEWAY)
				.body(ErrorResponse.of(
						HttpStatus.BAD_GATEWAY,
						"Binance API Error: " + ex.getMessage(),
						"/api/market"
				));
	}

	/**
	 * Handles symbol not found exceptions.
	 */
	@ExceptionHandler(SymbolNotFoundException.class)
	public ResponseEntity<ErrorResponse> handleSymbolNotFoundException(SymbolNotFoundException ex) {
		log.warn("Symbol not found: {}", ex.getMessage());
		return ResponseEntity
				.status(HttpStatus.NOT_FOUND)
				.body(ErrorResponse.of(
						HttpStatus.NOT_FOUND,
						ex.getMessage(),
						"/api/market"
				));
	}

	/**
	 * Handles WebSocket exceptions.
	 */
	@ExceptionHandler(WebSocketException.class)
	public ResponseEntity<ErrorResponse> handleWebSocketException(WebSocketException ex) {
		log.error("WebSocket error: {}", ex.getMessage());
		return ResponseEntity
				.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(ErrorResponse.of(
						HttpStatus.INTERNAL_SERVER_ERROR,
						"WebSocket Error: " + ex.getMessage(),
						"/ws/market"
				));
	}

	/**
	 * Handles validation errors.
	 */
	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
		Map<String, String> errors = new HashMap<>();
		ex.getBindingResult().getAllErrors().forEach(error -> {
			String fieldName = ((FieldError) error).getField();
			String errorMessage = error.getDefaultMessage();
			errors.put(fieldName, errorMessage);
		});

		Map<String, Object> response = new HashMap<>();
		response.put("status", HttpStatus.BAD_REQUEST.value());
		response.put("error", "Validation Error");
		response.put("errors", errors);
		response.put("timestamp", Instant.now().toEpochMilli());

		log.warn("Validation error: {}", errors);
		return ResponseEntity.badRequest().body(response);
	}

	/**
	 * Handles all other exceptions.
	 */
	@ExceptionHandler(Exception.class)
	public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
		log.error("Unexpected error: {}", ex.getMessage(), ex);
		return ResponseEntity
				.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(ErrorResponse.of(
						HttpStatus.INTERNAL_SERVER_ERROR,
						"Internal Server Error: " + ex.getMessage(),
						"/api"
				));
	}
}
