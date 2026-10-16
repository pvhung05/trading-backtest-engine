package com.trading.script.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trading.script.compiler.CompiledScriptIR;
import com.trading.script.model.JobStatus;
import com.trading.script.model.ScriptBacktestJob;
import com.trading.script.repository.ScriptBacktestJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScriptExecutionDispatcher {

    private final ScriptBacktestJobRepository jobRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.backtest-service.url:http://localhost:8083}")
    private String backtestServiceUrl;

    @Async("scriptJobExecutor")
    public void executeJobAsync(String jobId, CompiledScriptIR ir) {
        log.info("Starting execution for script job: {}", jobId);
        long startTimeMs = System.currentTimeMillis();

        ScriptBacktestJob job = null;
        for (int i = 0; i < 10; i++) {
            job = jobRepository.findById(jobId).orElse(null);
            if (job != null) break;
            try {
                Thread.sleep(50);
            } catch (InterruptedException ignored) {}
        }
        if (job == null) {
            log.error("Job not found after retries: {}", jobId);
            return;
        }

        try {
            job.setStatus(JobStatus.RUNNING);
            jobRepository.save(job);

            String url = backtestServiceUrl + "/api/internal/v1/backtest/dynamic-run";

            Map<String, Object> payload = new HashMap<>();
            payload.put("userId", job.getUserId());
            payload.put("symbol", job.getSymbol());
            payload.put("timeframe", job.getTimeframe());
            payload.put("startTime", job.getStartTime().toString());
            payload.put("endTime", job.getEndTime().toString());
            payload.put("initialCapital", job.getInitialCapital());
            payload.put("commissionRate", job.getCommissionRate());
            payload.put("slippageRate", job.getSlippageRate());
            payload.put("positionSizePercent", job.getPositionSizePercent());
            payload.put("entryRule", ir.getEntryRule());
            payload.put("exitRule", ir.getExitRule());
            payload.put("warmupBars", ir.getWarmupBarsRequired());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

            log.info("Dispatching dynamic backtest to {}: symbol={}, tf={}", url, job.getSymbol(), job.getTimeframe());
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            long duration = System.currentTimeMillis() - startTimeMs;
            job.setDurationMs(duration);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                job.setStatus(JobStatus.COMPLETED);
                job.setResultPayload(response.getBody());

                try {
                    JsonNode root = objectMapper.readTree(response.getBody());
                    if (root.has("id")) {
                        job.setBacktestRunId(root.get("id").asLong());
                    }
                } catch (Exception ignored) {
                }

                log.info("Job {} completed successfully in {} ms", jobId, duration);
            } else {
                job.setStatus(JobStatus.FAILED);
                job.setErrorCode("HTTP_" + response.getStatusCode().value());
                job.setErrorMessage("Engine returned non-success response: " + response.getStatusCode());
                log.warn("Job {} failed with status {}", jobId, response.getStatusCode());
            }

        } catch (HttpStatusCodeException ex) {
            long duration = System.currentTimeMillis() - startTimeMs;
            job.setDurationMs(duration);
            job.setStatus(JobStatus.FAILED);
            job.setErrorCode("ENGINE_HTTP_ERROR");
            job.setErrorMessage(ex.getResponseBodyAsString().isBlank() ? ex.getMessage() : ex.getResponseBodyAsString());
            log.error("Job {} failed with HTTP error: {}", jobId, ex.getMessage());
        } catch (Exception ex) {
            long duration = System.currentTimeMillis() - startTimeMs;
            job.setDurationMs(duration);
            job.setStatus(JobStatus.FAILED);
            job.setErrorCode("INTERNAL_DISPATCH_ERROR");
            job.setErrorMessage(ex.getMessage());
            log.error("Job {} failed with exception", jobId, ex);
        } finally {
            jobRepository.save(job);
        }
    }
}
