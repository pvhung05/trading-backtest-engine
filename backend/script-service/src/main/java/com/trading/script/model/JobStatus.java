package com.trading.script.model;

public enum JobStatus {
    QUEUED,
    FETCHING_DATA,
    RUNNING,
    COMPLETED,
    FAILED,
    CANCELLED,
    TIMEOUT
}
