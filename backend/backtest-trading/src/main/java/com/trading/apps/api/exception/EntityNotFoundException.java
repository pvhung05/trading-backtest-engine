package com.trading.apps.api.exception;

/**
 * Thrown when a requested entity cannot be found.
 */
public class EntityNotFoundException extends RuntimeException {

    public EntityNotFoundException(String message) {
        super(message);
    }
}
