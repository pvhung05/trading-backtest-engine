package com.trading.script.controller;

import com.trading.script.compiler.CompiledScriptIR;
import com.trading.script.compiler.PineScriptCompiler;
import com.trading.script.compiler.ScriptCompilationException;
import com.trading.script.dto.*;
import com.trading.script.security.UserPrincipal;
import com.trading.script.service.ScriptJobService;
import com.trading.script.service.ScriptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/scripts")
@Validated
@RequiredArgsConstructor
public class ScriptController {

    private final ScriptService scriptService;
    private final ScriptJobService jobService;
    private final PineScriptCompiler compiler;

    private Long getUserId(UserPrincipal principal) {
        if (principal == null || principal.getId() == null) {
            return 1L;
        }
        return principal.getId();
    }

    /**
     * Dry-run compile a script to check syntax and get AST/IR without saving.
     */
    @PostMapping("/compile")
    public ResponseEntity<CompileScriptResponse> compileScript(@Valid @RequestBody CompileScriptRequest request) {
        try {
            CompiledScriptIR ir = compiler.compile(request.sourceCode());
            return ResponseEntity.ok(CompileScriptResponse.builder()
                    .success(true)
                    .strategyTitle(ir.getStrategyTitle())
                    .warmupBarsRequired(ir.getWarmupBarsRequired())
                    .complexityScore(ir.getComplexityScore())
                    .sourceHash(ir.getSourceHash())
                    .entryRule(ir.getEntryRule())
                    .exitRule(ir.getExitRule())
                    .startTime(ir.getStartTime())
                    .endTime(ir.getEndTime())
                    .timeframe(ir.getTimeframe())
                    .plots(ir.getPlots())
                    .build());
        } catch (ScriptCompilationException ex) {
            return ResponseEntity.badRequest().body(CompileScriptResponse.builder()
                    .success(false)
                    .error(ex.getMessage())
                    .line(ex.getLine())
                    .column(ex.getColumn())
                    .build());
        }
    }

    /**
     * Create a new script and save initial version.
     */
    @PostMapping
    public ResponseEntity<ScriptDetailResponse> createScript(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateScriptRequest request) {
        Long userId = getUserId(principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(scriptService.createScript(userId, request));
    }

    /**
     * List current user's scripts.
     */
    @GetMapping
    public ResponseEntity<List<ScriptSummaryResponse>> listScripts(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = getUserId(principal);
        return ResponseEntity.ok(scriptService.listScripts(userId, page, size));
    }

    /**
     * Get specific script detail with latest version code.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ScriptDetailResponse> getScript(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        Long userId = getUserId(principal);
        return ResponseEntity.ok(scriptService.getScript(userId, id));
    }

    /**
     * Update an existing script and create a new version.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ScriptDetailResponse> updateScript(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody UpdateScriptRequest request) {
        Long userId = getUserId(principal);
        return ResponseEntity.ok(scriptService.updateScript(userId, id, request));
    }

    /**
     * Delete / Archive a script.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteScript(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        Long userId = getUserId(principal);
        scriptService.deleteScript(userId, id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Submit an asynchronous backtest job for a saved script.
     */
    @PostMapping("/{id}/run")
    public ResponseEntity<ScriptJobResponse> runScript(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody RunScriptJobRequest request) {
        Long userId = getUserId(principal);
        RunScriptJobRequest mergedRequest = new RunScriptJobRequest(
                id,
                null,
                request.symbol(),
                request.timeframe(),
                request.startTime(),
                request.endTime(),
                request.initialCapital(),
                request.commissionRate(),
                request.slippageRate(),
                request.positionSizePercent(),
                request.idempotencyKey()
        );
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(jobService.submitJob(userId, mergedRequest));
    }

    /**
     * Submit a direct backtest job with raw script code.
     */
    @PostMapping("/run-direct")
    public ResponseEntity<ScriptJobResponse> runDirect(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody RunScriptJobRequest request) {
        Long userId = getUserId(principal);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(jobService.submitJob(userId, request));
    }

    /**
     * Check job status and result.
     */
    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<ScriptJobResponse> getJob(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String jobId) {
        Long userId = getUserId(principal);
        return ResponseEntity.ok(jobService.getJob(userId, jobId));
    }

    /**
     * List user's backtest jobs.
     */
    @GetMapping("/jobs")
    public ResponseEntity<List<ScriptJobResponse>> listJobs(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = getUserId(principal);
        return ResponseEntity.ok(jobService.listUserJobs(userId, page, size));
    }

    /**
     * Cancel a running or queued job.
     */
    @PostMapping("/jobs/{jobId}/cancel")
    public ResponseEntity<ScriptJobResponse> cancelJob(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String jobId) {
        Long userId = getUserId(principal);
        return ResponseEntity.ok(jobService.cancelJob(userId, jobId));
    }
}
