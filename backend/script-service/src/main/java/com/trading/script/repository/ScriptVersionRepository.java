package com.trading.script.repository;

import com.trading.script.model.ScriptVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ScriptVersionRepository extends JpaRepository<ScriptVersion, String> {
    Optional<ScriptVersion> findFirstByScriptIdOrderByVersionNumberDesc(String scriptId);
    Optional<ScriptVersion> findByScriptIdAndVersionNumber(String scriptId, int versionNumber);
}
