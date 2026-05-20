package com.trading.apps.market.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Duration;

import org.junit.jupiter.api.Test;

import com.trading.apps.market.exception.MarketDataException;

class TimeframeUtilTest {

    @Test
    void shouldConvertSupportedTimeframe() {
        assertEquals(Duration.ofMinutes(5), TimeframeUtil.toDuration("5m"));
        assertEquals(Duration.ofHours(1), TimeframeUtil.toDuration("1h"));
        assertEquals(Duration.ofDays(1), TimeframeUtil.toDuration("1d"));
    }

    @Test
    void shouldReportSupportedTimeframes() {
        assertTrue(TimeframeUtil.isSupported("5m"));
        assertFalse(TimeframeUtil.isSupported("7m"));
    }

    @Test
    void shouldRejectUnsupportedTimeframe() {
        assertThrows(MarketDataException.class, () -> TimeframeUtil.toDuration("7m"));
    }
}