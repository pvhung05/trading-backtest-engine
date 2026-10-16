package com.trading.script.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trading.script.compiler.CompiledScriptIR;
import com.trading.script.compiler.PineScriptCompiler;
import com.trading.script.dto.RunScriptJobRequest;
import com.trading.script.dto.ScriptJobResponse;
import com.trading.script.model.JobStatus;
import com.trading.script.model.Script;
import com.trading.script.model.ScriptBacktestJob;
import com.trading.script.model.ScriptVersion;
import com.trading.script.repository.ScriptBacktestJobRepository;
import com.trading.script.repository.ScriptRepository;
import com.trading.script.repository.ScriptVersionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.trading.script.compiler.DateParsingUtils;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScriptJobService {

    private final ScriptBacktestJobRepository jobRepository;
    private final ScriptRepository scriptRepository;
    private final ScriptVersionRepository versionRepository;
    private final PineScriptCompiler compiler;
    private final ScriptExecutionDispatcher executionDispatcher;
    private final ObjectMapper objectMapper;

    @Transactional
    public ScriptJobResponse submitJob(Long userId, RunScriptJobRequest request) {
        CompiledScriptIR ir;
        String scriptId = request.scriptId();
        String scriptVersionId = null;

        if (scriptId != null && !scriptId.isBlank()) {
            Script script = scriptRepository.findByIdAndUserId(scriptId, userId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Script not found"));
            ScriptVersion version = versionRepository.findFirstByScriptIdOrderByVersionNumberDesc(scriptId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Script has no versions"));

            scriptVersionId = version.getId();
            try {
                ir = objectMapper.readValue(version.getCompiledIr(), CompiledScriptIR.class);
            } catch (Exception e) {
                // Recompile if cache corrupted
                ir = compiler.compile(version.getSourceCode());
            }
        } else if (request.sourceCode() != null && !request.sourceCode().isBlank()) {
            ir = compiler.compile(request.sourceCode());
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Either scriptId or sourceCode must be provided");
        }

        // Idempotency check
        String idempotencyKey = request.idempotencyKey();
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            Optional<ScriptBacktestJob> existing = jobRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                ScriptBacktestJob existingJob = existing.get();
                if (existingJob.getUserId().equals(userId)) {
                    log.info("Returning existing job for idempotency key: {}", idempotencyKey);
                    return toJobResponse(existingJob);
                }
            }
        } else {
            idempotencyKey = java.util.UUID.randomUUID().toString();
        }

        // Prioritize in-code dates if provided in script
        Instant effectiveStartTime = request.startTime();
        if (ir.getStartTime() != null && !ir.getStartTime().isBlank()) {
            Instant parsedStart = DateParsingUtils.parseToInstant(ir.getStartTime(), false);
            if (parsedStart != null) {
                effectiveStartTime = parsedStart;
                log.info("Overriding backtest startTime with in-code configuration: {}", effectiveStartTime);
            }
        }

        Instant effectiveEndTime = request.getEndTimeOrNow();
        if (ir.getEndTime() != null && !ir.getEndTime().isBlank()) {
            Instant parsedEnd = DateParsingUtils.parseToInstant(ir.getEndTime(), true);
            if (parsedEnd != null) {
                effectiveEndTime = parsedEnd;
                log.info("Overriding backtest endTime with in-code configuration: {}", effectiveEndTime);
            }
        }

        // Prioritize in-code timeframe if provided in script
        String effectiveTimeframe = request.timeframe().toLowerCase();
        if (ir.getTimeframe() != null && !ir.getTimeframe().isBlank()) {
            String parsedTf = DateParsingUtils.normalizeTimeframe(ir.getTimeframe());
            if (parsedTf != null && !parsedTf.isBlank()) {
                effectiveTimeframe = parsedTf;
                log.info("Overriding backtest timeframe with in-code configuration: {}", effectiveTimeframe);
            }
        }

        ScriptBacktestJob job = ScriptBacktestJob.builder()
                .userId(userId)
                .scriptId(scriptId)
                .scriptVersionId(scriptVersionId)
                .symbol(request.symbol().toUpperCase())
                .timeframe(effectiveTimeframe)
                .startTime(effectiveStartTime)
                .endTime(effectiveEndTime)
                .initialCapital(ir.getInitialCapital() != null ? ir.getInitialCapital() : request.getInitialCapitalOrDefault())
                .commissionRate(ir.getCommissionValue() != null ? ir.getCommissionValue() : request.getCommissionRateOrDefault())
                .slippageRate(request.getSlippageRateOrDefault())
                .positionSizePercent(ir.getDefaultQtyValue() != null ? ir.getDefaultQtyValue() : request.getPositionSizePercentOrDefault())
                .status(JobStatus.QUEUED)
                .idempotencyKey(idempotencyKey)
                .build();

        job = jobRepository.saveAndFlush(job);

        // Dispatch async execution
        executionDispatcher.executeJobAsync(job.getId(), ir);

        return toJobResponse(job);
    }

    @Transactional(readOnly = true)
    public ScriptJobResponse getJob(Long userId, String jobId) {
        ScriptBacktestJob job = jobRepository.findByIdAndUserId(jobId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        return toJobResponse(job);
    }

    @Transactional(readOnly = true)
    public List<ScriptJobResponse> listUserJobs(Long userId, int page, int size) {
        Page<ScriptBacktestJob> jobs = jobRepository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(page, size));
        return jobs.map(this::toJobResponse).getContent();
    }

    @Transactional
    public ScriptJobResponse cancelJob(Long userId, String jobId) {
        ScriptBacktestJob job = jobRepository.findByIdAndUserId(jobId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        if (job.getStatus() == JobStatus.QUEUED || job.getStatus() == JobStatus.RUNNING) {
            job.setStatus(JobStatus.CANCELLED);
            job.setErrorMessage("Job cancelled by user request");
            job = jobRepository.save(job);
        }

        return toJobResponse(job);
    }

    private ScriptJobResponse toJobResponse(ScriptBacktestJob job) {
        Object parsedResult = null;
        if (job.getResultPayload() != null && !job.getResultPayload().isBlank()) {
            try {
                parsedResult = objectMapper.readTree(job.getResultPayload());
            } catch (Exception e) {
                parsedResult = job.getResultPayload();
            }
        }

        return ScriptJobResponse.builder()
                .jobId(job.getId())
                .userId(job.getUserId())
                .scriptId(job.getScriptId())
                .symbol(job.getSymbol())
                .timeframe(job.getTimeframe())
                .status(job.getStatus())
                .errorCode(job.getErrorCode())
                .errorMessage(job.getErrorMessage())
                .backtestRunId(job.getBacktestRunId())
                .durationMs(job.getDurationMs())
                .result(parsedResult)
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .build();
    }
}
