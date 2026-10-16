package com.trading.script.compiler;

import lombok.Getter;

@Getter
public class ScriptCompilationException extends RuntimeException {
    private final int line;
    private final int column;

    public ScriptCompilationException(String message) {
        super(message);
        this.line = 1;
        this.column = 1;
    }

    public ScriptCompilationException(String message, int line, int column) {
        super(String.format("Error at [%d:%d]: %s", line, column, message));
        this.line = line;
        this.column = column;
    }

    public ScriptCompilationException(String message, Throwable cause) {
        super(message, cause);
        this.line = 1;
        this.column = 1;
    }
}
