package com.trading.script.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trading.script.compiler.CompiledScriptIR;
import com.trading.script.compiler.PineScriptCompiler;
import com.trading.script.dto.CreateScriptRequest;
import com.trading.script.dto.ScriptDetailResponse;
import com.trading.script.dto.ScriptSummaryResponse;
import com.trading.script.dto.UpdateScriptRequest;
import com.trading.script.model.Script;
import com.trading.script.model.ScriptVersion;
import com.trading.script.repository.ScriptRepository;
import com.trading.script.repository.ScriptVersionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ScriptService {

    private final ScriptRepository scriptRepository;
    private final ScriptVersionRepository versionRepository;
    private final PineScriptCompiler compiler;
    private final ObjectMapper objectMapper;

    @Transactional
    public ScriptDetailResponse createScript(Long userId, CreateScriptRequest request) {
        CompiledScriptIR ir = compiler.compile(request.sourceCode());
        String compiledIrJson = serializeIr(ir);

        Script script = Script.builder()
                .userId(userId)
                .title(request.title())
                .description(request.description())
                .visibility(request.getVisibilityOrDefault())
                .archived(false)
                .build();
        script = scriptRepository.save(script);

        ScriptVersion version = ScriptVersion.builder()
                .script(script)
                .versionNumber(1)
                .sourceCode(request.sourceCode())
                .compiledIr(compiledIrJson)
                .sourceHash(ir.getSourceHash())
                .astComplexityScore(ir.getComplexityScore())
                .build();
        version = versionRepository.save(version);

        return toDetailResponse(script, version);
    }

    @Transactional
    public ScriptDetailResponse updateScript(Long userId, String scriptId, UpdateScriptRequest request) {
        Script script = scriptRepository.findByIdAndUserId(scriptId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Script not found"));

        if (request.title() != null && !request.title().isBlank()) {
            script.setTitle(request.title());
        }
        if (request.description() != null) {
            script.setDescription(request.description());
        }
        if (request.visibility() != null) {
            script.setVisibility(request.visibility());
        }

        ScriptVersion latestVersion = versionRepository.findFirstByScriptIdOrderByVersionNumberDesc(scriptId)
                .orElse(null);

        if (request.sourceCode() != null && !request.sourceCode().isBlank()) {
            CompiledScriptIR ir = compiler.compile(request.sourceCode());
            String compiledIrJson = serializeIr(ir);

            int nextVersionNum = (latestVersion != null) ? latestVersion.getVersionNumber() + 1 : 1;
            ScriptVersion newVersion = ScriptVersion.builder()
                    .script(script)
                    .versionNumber(nextVersionNum)
                    .sourceCode(request.sourceCode())
                    .compiledIr(compiledIrJson)
                    .sourceHash(ir.getSourceHash())
                    .astComplexityScore(ir.getComplexityScore())
                    .build();
            latestVersion = versionRepository.save(newVersion);
        }

        script = scriptRepository.save(script);
        return toDetailResponse(script, latestVersion);
    }

    @Transactional(readOnly = true)
    public ScriptDetailResponse getScript(Long userId, String scriptId) {
        Script script = scriptRepository.findByIdAndUserId(scriptId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Script not found"));
        ScriptVersion latestVersion = versionRepository.findFirstByScriptIdOrderByVersionNumberDesc(scriptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No versions found for script"));

        return toDetailResponse(script, latestVersion);
    }

    @Transactional(readOnly = true)
    public List<ScriptSummaryResponse> listScripts(Long userId, int page, int size) {
        Page<Script> scripts = scriptRepository.findByUserIdAndArchivedFalseOrderByUpdatedAtDesc(
                userId, PageRequest.of(page, size));

        return scripts.map(s -> {
            int latestVersion = versionRepository.findFirstByScriptIdOrderByVersionNumberDesc(s.getId())
                    .map(ScriptVersion::getVersionNumber)
                    .orElse(1);
            return new ScriptSummaryResponse(
                    s.getId(),
                    s.getUserId(),
                    s.getTitle(),
                    s.getDescription(),
                    s.getVisibility(),
                    latestVersion,
                    s.getCreatedAt(),
                    s.getUpdatedAt()
            );
        }).getContent();
    }

    @Transactional
    public void deleteScript(Long userId, String scriptId) {
        Script script = scriptRepository.findByIdAndUserId(scriptId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Script not found"));
        script.setArchived(true);
        scriptRepository.save(script);
    }

    private String serializeIr(CompiledScriptIR ir) {
        try {
            return objectMapper.writeValueAsString(ir);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    private ScriptDetailResponse toDetailResponse(Script s, ScriptVersion v) {
        return new ScriptDetailResponse(
                s.getId(),
                s.getUserId(),
                s.getTitle(),
                s.getDescription(),
                s.getVisibility(),
                v != null ? v.getVersionNumber() : 1,
                v != null ? v.getSourceCode() : "",
                v != null ? v.getCompiledIr() : "{}",
                v != null ? v.getSourceHash() : "",
                v != null ? v.getAstComplexityScore() : 0,
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }
}
