package com.trading.script.compiler;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import org.springframework.stereotype.Component;

/**
 * High-performance, secure parser and compiler for TradingView Pine Script (v5 & v4) DSL.
 * Converts user trading scripts into an Intermediate Representation (IR)
 * without arbitrary JVM code execution or external I/O.
 */
@Component
public class PineScriptCompiler {

    private static final int MAX_NODES = 500;
    private static final int MAX_DEPTH = 20;

    private final ShorthandStrategyTranspiler shorthandTranspiler;

    public PineScriptCompiler() {
        this.shorthandTranspiler = new ShorthandStrategyTranspiler();
    }

    @org.springframework.beans.factory.annotation.Autowired
    public PineScriptCompiler(ShorthandStrategyTranspiler shorthandTranspiler) {
        this.shorthandTranspiler = shorthandTranspiler != null ? shorthandTranspiler : new ShorthandStrategyTranspiler();
    }

    private record PreprocessResult(String cleanedSource, String directiveStart, String directiveEnd, String directiveTimeframe) {}

    public CompiledScriptIR compile(String sourceCode) {
        if (sourceCode == null || sourceCode.isBlank()) {
            throw new ScriptCompilationException("Script source code cannot be empty");
        }

        // Transpile shorthand notation (English / Vietnamese) to Pine Script syntax if detected
        if (shorthandTranspiler.isShorthand(sourceCode)) {
            sourceCode = shorthandTranspiler.transpile(sourceCode);
        }

        PreprocessResult prep = preprocess(sourceCode);
        String cleanedSource = prep.cleanedSource();
        String sourceHash = computeHash(cleanedSource);

        List<Token> tokens = tokenize(cleanedSource);
        Parser parser = new Parser(tokens);
        return parser.parse(sourceHash, prep.directiveStart(), prep.directiveEnd(), prep.directiveTimeframe());
    }

    private PreprocessResult preprocess(String source) {
        String directiveStart = null;
        String directiveEnd = null;
        String directiveTimeframe = null;

        // Check for directives before removing comments
        java.util.regex.Pattern startDirPattern = java.util.regex.Pattern.compile(
                "(?im)^\\s*//\\s*@(?:start|start_time|start_date|from|from_date)\\s*[:=]?\\s*([^\r\n]+)");
        java.util.regex.Pattern endDirPattern = java.util.regex.Pattern.compile(
                "(?im)^\\s*//\\s*@(?:end|end_time|end_date|to|to_date)\\s*[:=]?\\s*([^\r\n]+)");
        java.util.regex.Pattern tfDirPattern = java.util.regex.Pattern.compile(
                "(?im)^\\s*//\\s*@(?:timeframe|tf|interval|resolution)\\s*[:=]?\\s*([^\r\n]+)");

        java.util.regex.Matcher mStart = startDirPattern.matcher(source);
        if (mStart.find()) {
            directiveStart = mStart.group(1).trim();
        }
        java.util.regex.Matcher mEnd = endDirPattern.matcher(source);
        if (mEnd.find()) {
            directiveEnd = mEnd.group(1).trim();
        }
        java.util.regex.Matcher mTf = tfDirPattern.matcher(source);
        if (mTf.find()) {
            directiveTimeframe = DateParsingUtils.normalizeTimeframe(mTf.group(1).trim());
        }

        // Strip multiline comments /* ... */
        String withoutMultiLine = source.replaceAll("/\\*[\\s\\S]*?\\*/", " ");
        StringBuilder sb = new StringBuilder();
        String[] lines = withoutMultiLine.split("\\r?\\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.startsWith("//@version")) {
                continue;
            }
            int commentIdx = line.indexOf("//");
            if (commentIdx != -1) {
                line = line.substring(0, commentIdx);
            }
            sb.append(line).append("\n");
        }
        return new PreprocessResult(sb.toString(), directiveStart, directiveEnd, directiveTimeframe);
    }

    private String computeHash(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            return UUID.randomUUID().toString().replace("-", "");
        }
    }

    // =========================================================================
    // TOKENIZER
    // =========================================================================
    private enum TokenType {
        IDENTIFIER, NUMBER, STRING,
        LPAREN, RPAREN,          // ( )
        LBRACKET, RBRACKET,      // [ ]
        COMMA,                   // ,
        EQUALS,                  // =
        ASSIGN_COLON,            // :=
        COLON,                   // :
        GT, LT, GTE, LTE, EQ, NEQ,// > < >= <= == !=
        AND, OR, NOT,            // and, or, not
        PLUS, MINUS, STAR, SLASH,// + - * /
        IF, ELSE,                // if, else
        VAR, VARIP,              // var, varip
        TRUE, FALSE,             // true, false
        EOF
    }

    private record Token(TokenType type, String text, int line, int col) {}

    private List<Token> tokenize(String input) {
        List<Token> tokens = new ArrayList<>();
        int line = 1;
        int col = 1;
        int i = 0;
        int len = input.length();

        while (i < len) {
            char c = input.charAt(i);

            if (c == '\n') {
                line++;
                col = 1;
                i++;
                continue;
            }
            if (Character.isWhitespace(c)) {
                col++;
                i++;
                continue;
            }

            int startCol = col;

            // Symbols & operators
            if (c == '(') {
                tokens.add(new Token(TokenType.LPAREN, "(", line, startCol));
                i++; col++;
            } else if (c == ')') {
                tokens.add(new Token(TokenType.RPAREN, ")", line, startCol));
                i++; col++;
            } else if (c == '[') {
                tokens.add(new Token(TokenType.LBRACKET, "[", line, startCol));
                i++; col++;
            } else if (c == ']') {
                tokens.add(new Token(TokenType.RBRACKET, "]", line, startCol));
                i++; col++;
            } else if (c == ',') {
                tokens.add(new Token(TokenType.COMMA, ",", line, startCol));
                i++; col++;
            } else if (c == ':' && i + 1 < len && input.charAt(i + 1) == '=') {
                tokens.add(new Token(TokenType.ASSIGN_COLON, ":=", line, startCol));
                i += 2; col += 2;
            } else if (c == ':') {
                tokens.add(new Token(TokenType.COLON, ":", line, startCol));
                i++; col++;
            } else if (c == '=' && i + 1 < len && input.charAt(i + 1) == '=') {
                tokens.add(new Token(TokenType.EQ, "==", line, startCol));
                i += 2; col += 2;
            } else if (c == '=') {
                tokens.add(new Token(TokenType.EQUALS, "=", line, startCol));
                i++; col++;
            } else if (c == '!' && i + 1 < len && input.charAt(i + 1) == '=') {
                tokens.add(new Token(TokenType.NEQ, "!=", line, startCol));
                i += 2; col += 2;
            } else if (c == '!') {
                tokens.add(new Token(TokenType.NOT, "!", line, startCol));
                i++; col++;
            } else if (c == '&' && i + 1 < len && input.charAt(i + 1) == '&') {
                tokens.add(new Token(TokenType.AND, "&&", line, startCol));
                i += 2; col += 2;
            } else if (c == '|' && i + 1 < len && input.charAt(i + 1) == '|') {
                tokens.add(new Token(TokenType.OR, "||", line, startCol));
                i += 2; col += 2;
            } else if (c == '>' && i + 1 < len && input.charAt(i + 1) == '=') {
                tokens.add(new Token(TokenType.GTE, ">=", line, startCol));
                i += 2; col += 2;
            } else if (c == '>') {
                tokens.add(new Token(TokenType.GT, ">", line, startCol));
                i++; col++;
            } else if (c == '<' && i + 1 < len && input.charAt(i + 1) == '=') {
                tokens.add(new Token(TokenType.LTE, "<=", line, startCol));
                i += 2; col += 2;
            } else if (c == '<') {
                tokens.add(new Token(TokenType.LT, "<", line, startCol));
                i++; col++;
            } else if (c == '+') {
                tokens.add(new Token(TokenType.PLUS, "+", line, startCol));
                i++; col++;
            } else if (c == '-') {
                tokens.add(new Token(TokenType.MINUS, "-", line, startCol));
                i++; col++;
            } else if (c == '*') {
                tokens.add(new Token(TokenType.STAR, "*", line, startCol));
                i++; col++;
            } else if (c == '/') {
                tokens.add(new Token(TokenType.SLASH, "/", line, startCol));
                i++; col++;
            } else if (c == '"' || c == '\'') {
                // String literal
                char quote = c;
                int start = ++i;
                col++;
                while (i < len && input.charAt(i) != quote && input.charAt(i) != '\n') {
                    if (input.charAt(i) == '\\' && i + 1 < len) {
                        i += 2;
                        col += 2;
                        continue;
                    }
                    i++; col++;
                }
                if (i >= len || input.charAt(i) != quote) {
                    throw new ScriptCompilationException("Unclosed string literal", line, startCol);
                }
                String val = input.substring(start, i);
                tokens.add(new Token(TokenType.STRING, val, line, startCol));
                i++; col++;
            } else if (Character.isDigit(c)) {
                // Number literal
                int start = i;
                boolean hasDot = false;
                while (i < len && (Character.isDigit(input.charAt(i)) || 
                       (!hasDot && input.charAt(i) == '.' && i + 1 < len && Character.isDigit(input.charAt(i + 1))))) {
                    if (input.charAt(i) == '.') hasDot = true;
                    i++; col++;
                }
                tokens.add(new Token(TokenType.NUMBER, input.substring(start, i), line, startCol));
            } else if (Character.isJavaIdentifierStart(c)) {
                // Identifier or keyword (supports dot inside, like ta.sma, strategy.entry)
                int start = i;
                while (i < len && (Character.isJavaIdentifierPart(input.charAt(i)) || input.charAt(i) == '.')) {
                    i++; col++;
                }
                String word = input.substring(start, i);
                TokenType kwType = switch (word.toLowerCase()) {
                    case "if" -> TokenType.IF;
                    case "else" -> TokenType.ELSE;
                    case "var" -> TokenType.VAR;
                    case "varip" -> TokenType.VARIP;
                    case "and" -> TokenType.AND;
                    case "or" -> TokenType.OR;
                    case "not" -> TokenType.NOT;
                    case "true" -> TokenType.TRUE;
                    case "false" -> TokenType.FALSE;
                    default -> TokenType.IDENTIFIER;
                };
                tokens.add(new Token(kwType, word, line, startCol));
            } else {
                throw new ScriptCompilationException("Unexpected character: '" + c + "'", line, startCol);
            }
        }

        tokens.add(new Token(TokenType.EOF, "", line, col));
        return tokens;
    }

    // =========================================================================
    // PARSER & AST BUILDER
    // =========================================================================
    private static class StrategyMeta {
        String title = "Custom Pine Script Strategy";
        Double initialCapital = 10000.0;
        Double defaultQtyValue = 100.0;
        Double commissionValue = 0.001;
        Boolean overlay = true;
        String startTime = null;
        String endTime = null;
        String timeframe = null;
    }

    private record TupleResult(String type, Map<String, Object> part1, Map<String, Object> part2, Map<String, Object> part3) {}

    private record RuleActionResult(boolean isEntry, boolean isExit, Map<String, Object> rule) {}

    private static class Parser {
        private final List<Token> tokens;
        private int pos = 0;
        private final Map<String, Object> symbolVariables = new HashMap<>();
        private final StrategyMeta meta = new StrategyMeta();
        private int nodeCount = 0;
        private int maxPeriod = 14;
        private String directiveStart;
        private String directiveEnd;
        private String directiveTimeframe;
        private final List<PlotDefinition> plots = new ArrayList<>();

        public Parser(List<Token> tokens) {
            this.tokens = tokens;
        }

        public CompiledScriptIR parse(String sourceHash, String directiveStart, String directiveEnd, String directiveTimeframe) {
            this.directiveStart = directiveStart;
            this.directiveEnd = directiveEnd;
            this.directiveTimeframe = directiveTimeframe;

            if (directiveStart != null) {
                meta.startTime = DateParsingUtils.normalizeToString(directiveStart, false);
            }
            if (directiveEnd != null) {
                meta.endTime = DateParsingUtils.normalizeToString(directiveEnd, true);
            }
            if (directiveTimeframe != null) {
                meta.timeframe = DateParsingUtils.normalizeTimeframe(directiveTimeframe);
            }

            Map<String, Object> entryRule = null;
            Map<String, Object> exitRule = null;

            while (!isAtEnd()) {
                Token t = peek();

                // 1. strategy(...) declaration
                if (matchIdentifier("strategy")) {
                    parseStrategyDeclaration();
                }
                // 2. tuple assignment: [a, b, c] = expr
                else if (t.type() == TokenType.LBRACKET) {
                    parseTupleAssignment();
                }
                // 3. var / varip keyword: var float x = 10
                else if (t.type() == TokenType.VAR || t.type() == TokenType.VARIP) {
                    advance();
                    // Optional type name: float, int, bool, color, etc.
                    if (peek().type() == TokenType.IDENTIFIER && (peekNext().type() == TokenType.EQUALS || peekNext().type() == TokenType.ASSIGN_COLON)) {
                        parseVariableAssignment();
                    } else if (peek().type() == TokenType.IDENTIFIER && peekNext().type() == TokenType.IDENTIFIER) {
                        advance(); // consume type
                        parseVariableAssignment();
                    } else {
                        advance();
                    }
                }
                // 4. variable assignment: x = expr or x := expr
                else if (t.type() == TokenType.IDENTIFIER && (peekNext().type() == TokenType.EQUALS || peekNext().type() == TokenType.ASSIGN_COLON)) {
                    parseVariableAssignment();
                }
                // 5. if condition
                else if (t.type() == TokenType.IF) {
                    consume(TokenType.IF, "Expected 'if'");
                    boolean hasParen = match(TokenType.LPAREN);
                    Object condition = parseCondition();
                    if (hasParen) {
                        match(TokenType.RPAREN);
                    }

                    RuleActionResult result = parseRuleAction(condition);
                    if (result != null) {
                        if (result.isEntry()) {
                            entryRule = (entryRule == null) ? result.rule() : combineRules("OR", entryRule, result.rule());
                        } else if (result.isExit()) {
                            exitRule = (exitRule == null) ? result.rule() : combineRules("OR", exitRule, result.rule());
                        }
                    }
                }
                // 6. Direct strategy calls outside if (e.g. strategy.entry("Long", strategy.long, when = cond))
                else if (isStrategyOrderCall()) {
                    RuleActionResult result = parseDirectStrategyOrder();
                    if (result != null) {
                        if (result.isEntry()) {
                            entryRule = (entryRule == null) ? result.rule() : combineRules("OR", entryRule, result.rule());
                        } else if (result.isExit()) {
                            exitRule = (exitRule == null) ? result.rule() : combineRules("OR", exitRule, result.rule());
                        }
                    }
                }
                // 7. Visual calls: plot(...)
                else if (matchIdentifier("plot")) {
                    parsePlotCall();
                }
                // 8. Visual calls to safely ignore: hline, bgcolor, fill, alertcondition, etc.
                else if (isIgnoredStatement()) {
                    skipStatementCall();
                }
                else {
                    // Skip unrecognized or benign token
                    advance();
                }
            }

            if (entryRule == null) {
                // Default entry rule if none explicitly defined
                entryRule = Map.of("type", "CROSSED_UP", 
                        "left", Map.of("indicator", "SMA", "period", 10),
                        "right", Map.of("indicator", "SMA", "period", 30));
            }
            if (exitRule == null) {
                exitRule = Map.of("type", "CROSSED_DOWN",
                        "left", Map.of("indicator", "SMA", "period", 10),
                        "right", Map.of("indicator", "SMA", "period", 30));
            }

            return CompiledScriptIR.builder()
                    .strategyTitle(meta.title)
                    .entryRule(entryRule)
                    .exitRule(exitRule)
                    .warmupBarsRequired(Math.max(50, maxPeriod + 10))
                    .complexityScore(nodeCount)
                    .sourceHash(sourceHash)
                    .initialCapital(meta.initialCapital)
                    .defaultQtyValue(meta.defaultQtyValue)
                    .commissionValue(meta.commissionValue)
                    .overlay(meta.overlay)
                    .startTime(meta.startTime)
                    .endTime(meta.endTime)
                    .timeframe(meta.timeframe)
                    .plots(plots)
                    .build();
        }

        private void parseStrategyDeclaration() {
            consume(TokenType.LPAREN, "Expected '(' after strategy");
            boolean firstArg = true;
            while (!check(TokenType.RPAREN) && !isAtEnd()) {
                if (check(TokenType.STRING) && firstArg) {
                    meta.title = advance().text();
                    firstArg = false;
                } else if (check(TokenType.IDENTIFIER) && peekNext().type() == TokenType.EQUALS) {
                    String paramName = advance().text().toLowerCase();
                    consume(TokenType.EQUALS, "Expected '='");
                    Object val = parseExpression();
                    switch (paramName) {
                        case "title" -> { if (val instanceof String s) meta.title = s; }
                        case "overlay" -> { if (val instanceof Boolean b) meta.overlay = b; }
                        case "initial_capital" -> { if (val instanceof Number n) meta.initialCapital = n.doubleValue(); }
                        case "default_qty_value" -> { if (val instanceof Number n) meta.defaultQtyValue = n.doubleValue(); }
                        case "commission_value" -> { if (val instanceof Number n) meta.commissionValue = n.doubleValue(); }
                        case "start_time", "start_date", "from_date", "start", "from" -> {
                            if (this.directiveStart == null) {
                                meta.startTime = DateParsingUtils.normalizeToString(val, false);
                            }
                        }
                        case "end_time", "end_date", "to_date", "end", "to" -> {
                            if (this.directiveEnd == null) {
                                meta.endTime = DateParsingUtils.normalizeToString(val, true);
                            }
                        }
                        case "timeframe", "tf", "resolution", "interval" -> {
                            if (this.directiveTimeframe == null) {
                                meta.timeframe = DateParsingUtils.normalizeTimeframe(val);
                            }
                        }
                    }
                } else {
                    if (match(TokenType.COMMA)) continue;
                    advance();
                }
                match(TokenType.COMMA);
            }
            consume(TokenType.RPAREN, "Expected ')' after strategy declaration");
        }

        private void parseTupleAssignment() {
            consume(TokenType.LBRACKET, "Expected '['");
            List<String> varNames = new ArrayList<>();
            while (!check(TokenType.RBRACKET) && !isAtEnd()) {
                if (check(TokenType.IDENTIFIER)) {
                    varNames.add(advance().text());
                }
                match(TokenType.COMMA);
            }
            consume(TokenType.RBRACKET, "Expected ']'");
            if (!match(TokenType.EQUALS) && !match(TokenType.ASSIGN_COLON)) {
                throw new ScriptCompilationException("Expected '=' or ':=' after tuple declaration");
            }
            Object expr = parseExpression();
            if (expr instanceof TupleResult tuple) {
                if (varNames.size() > 0 && tuple.part1() != null) {
                    symbolVariables.put(varNames.get(0), tuple.part1());
                }
                if (varNames.size() > 1 && tuple.part2() != null) {
                    symbolVariables.put(varNames.get(1), tuple.part2());
                }
                if (varNames.size() > 2 && tuple.part3() != null) {
                    symbolVariables.put(varNames.get(2), tuple.part3());
                }
            }
        }

        private void parseVariableAssignment() {
            String varName = consume(TokenType.IDENTIFIER, "Expected variable name").text();
            if (!match(TokenType.EQUALS) && !match(TokenType.ASSIGN_COLON)) {
                throw new ScriptCompilationException("Expected '=' or ':=' in variable assignment");
            }
            Object expr = parseExpression();
            if (expr instanceof TupleResult tuple) {
                symbolVariables.put(varName, tuple.part1());
            } else {
                symbolVariables.put(varName, expr);
            }

            // Detect if this variable holds start or end time or timeframe
            String cleanName = varName.toLowerCase().replace("_", "");
            if (cleanName.equals("startdate") || cleanName.equals("starttime") || cleanName.equals("fromdate") || cleanName.equals("start")) {
                if (this.directiveStart == null) {
                    String parsed = DateParsingUtils.normalizeToString(expr, false);
                    if (parsed != null) {
                        meta.startTime = parsed;
                    }
                }
            } else if (cleanName.equals("enddate") || cleanName.equals("endtime") || cleanName.equals("todate") || cleanName.equals("end")) {
                if (this.directiveEnd == null) {
                    String parsed = DateParsingUtils.normalizeToString(expr, true);
                    if (parsed != null) {
                        meta.endTime = parsed;
                    }
                }
            } else if (cleanName.equals("timeframe") || cleanName.equals("tf") || cleanName.equals("interval") || cleanName.equals("resolution")) {
                if (this.directiveTimeframe == null) {
                    String parsed = DateParsingUtils.normalizeTimeframe(expr);
                    if (parsed != null) {
                        meta.timeframe = parsed;
                    }
                }
            }
        }

        private boolean isStrategyOrderCall() {
            if (check(TokenType.IDENTIFIER)) {
                String id = peek().text().toLowerCase();
                return id.equals("strategy.entry") ||
                       id.equals("strategy.close") ||
                       id.equals("strategy.close_all") ||
                       id.equals("strategy.exit");
            }
            return false;
        }

        private RuleActionResult parseDirectStrategyOrder() {
            String id = advance().text().toLowerCase();
            if (id.equals("strategy.entry")) {
                Map<String, Object> rule = parseStrategyOrderArgs(null);
                return new RuleActionResult(true, false, rule);
            } else {
                Map<String, Object> rule = parseStrategyOrderArgs(null);
                return new RuleActionResult(false, true, rule);
            }
        }

        private RuleActionResult parseRuleAction(Object condition) {
            // Check for nested if statements: if (cond1) if (cond2) strategy.entry(...)
            while (match(TokenType.IF)) {
                boolean hasParen = match(TokenType.LPAREN);
                Object nestedCond = parseCondition();
                if (hasParen) match(TokenType.RPAREN);
                condition = combineRules("AND", toRuleMap(condition), toRuleMap(nestedCond));
            }

            if (matchIdentifier("strategy.entry")) {
                Map<String, Object> rule = parseStrategyOrderArgs(condition);
                return new RuleActionResult(true, false, rule);
            } else if (matchIdentifier("strategy.close") || matchIdentifier("strategy.close_all") || matchIdentifier("strategy.exit")) {
                Map<String, Object> rule = parseStrategyOrderArgs(condition);
                return new RuleActionResult(false, true, rule);
            } else {
                // If it's a visual call or assignment inside if, consume it
                if (isIgnoredStatement()) {
                    skipStatementCall();
                } else if (peek().type() == TokenType.IDENTIFIER && (peekNext().type() == TokenType.EQUALS || peekNext().type() == TokenType.ASSIGN_COLON)) {
                    parseVariableAssignment();
                }
            }
            return null;
        }

        private Map<String, Object> parseStrategyOrderArgs(Object inheritedCondition) {
            consume(TokenType.LPAREN, "Expected '(' after strategy call");
            Object whenCondition = null;
            while (!check(TokenType.RPAREN) && !isAtEnd()) {
                if (check(TokenType.IDENTIFIER) && peek().text().equalsIgnoreCase("when") && peekNext().type() == TokenType.EQUALS) {
                    advance(); // when
                    consume(TokenType.EQUALS, "=");
                    whenCondition = parseCondition();
                } else {
                    advance();
                }
                match(TokenType.COMMA);
            }
            consume(TokenType.RPAREN, "Expected ')'");

            if (whenCondition != null) {
                return (inheritedCondition != null)
                        ? combineRules("AND", toRuleMap(inheritedCondition), toRuleMap(whenCondition))
                        : toRuleMap(whenCondition);
            }
            return toRuleMap(inheritedCondition);
        }

        private void parsePlotCall() {
            consume(TokenType.LPAREN, "Expected '(' after plot");
            Object seriesExpr = parseExpression();
            String title = null;
            String color = null;
            Integer linewidth = null;

            while (!check(TokenType.RPAREN) && !isAtEnd()) {
                if (match(TokenType.COMMA)) {
                    if (check(TokenType.RPAREN)) break;
                }
                if (check(TokenType.IDENTIFIER) && peekNext().type() == TokenType.EQUALS) {
                    String paramName = advance().text().toLowerCase();
                    consume(TokenType.EQUALS, "Expected '='");
                    if (paramName.equals("title")) {
                        Object val = parseExpression();
                        if (val instanceof String s) title = s;
                    } else if (paramName.equals("color")) {
                        Token colToken = peek();
                        if (colToken.type() == TokenType.STRING) {
                            color = advance().text();
                        } else if (colToken.type() == TokenType.IDENTIFIER) {
                            color = parseColorIdentifier(advance().text());
                        } else {
                            parseExpression();
                        }
                    } else if (paramName.equals("linewidth")) {
                        Object val = parseExpression();
                        if (val instanceof Number n) linewidth = n.intValue();
                    } else {
                        parseExpression();
                    }
                } else {
                    // Positional argument
                    if (title == null && check(TokenType.STRING)) {
                        title = advance().text();
                    } else if (color == null && check(TokenType.IDENTIFIER) && peek().text().toLowerCase().startsWith("color.")) {
                        color = parseColorIdentifier(advance().text());
                    } else {
                        advance();
                    }
                }
            }
            consume(TokenType.RPAREN, "Expected ')' after plot call");

            String indType = "LINE";
            Integer period = null;

            if (seriesExpr instanceof Map<?, ?> map) {
                Object ind = map.get("indicator");
                if (ind instanceof String s) indType = s;
                if (map.get("period") instanceof Number n) {
                    period = n.intValue();
                } else if (map.get("shortPeriod") instanceof Number n) {
                    period = n.intValue();
                }
            } else if (seriesExpr instanceof Number n) {
                indType = "LEVEL";
                period = n.intValue();
            }

            if (title == null || title.isBlank()) {
                if (period != null) {
                    title = indType + " (" + period + ")";
                } else {
                    title = indType;
                }
            }

            if (color == null || color.isBlank()) {
                color = "#3b82f6";
            }

            plots.add(new PlotDefinition(title, indType, period, color, linewidth));
        }

        private String parseColorIdentifier(String text) {
            String lower = text.toLowerCase();
            return switch (lower) {
                case "color.blue", "blue" -> "#3b82f6";
                case "color.red", "red" -> "#ef4444";
                case "color.green", "green" -> "#10b981";
                case "color.orange", "orange" -> "#f97316";
                case "color.purple", "purple" -> "#8b5cf6";
                case "color.yellow", "yellow" -> "#f59e0b";
                case "color.teal", "color.aqua", "teal", "aqua" -> "#06b6d4";
                case "color.white", "white" -> "#ffffff";
                case "color.black", "black" -> "#111827";
                case "color.gray", "gray" -> "#6b7280";
                case "color.navy", "navy" -> "#1e3a8a";
                case "color.maroon", "maroon" -> "#991b1b";
                case "color.lime", "lime" -> "#84cc16";
                case "color.fuchsia", "fuchsia" -> "#d946ef";
                default -> text.startsWith("#") ? text : "#3b82f6";
            };
        }

        private boolean isIgnoredStatement() {
            if (check(TokenType.IDENTIFIER)) {
                String name = peek().text().toLowerCase();
                return name.startsWith("plotshape") ||
                       name.startsWith("plotchar") ||
                       name.startsWith("plotarrow") ||
                       name.startsWith("plotbar") ||
                       name.startsWith("plotcandle") ||
                       name.equals("hline") ||
                       name.equals("bgcolor") ||
                       name.equals("fill") ||
                       name.equals("barcolor") ||
                       name.equals("alert") ||
                       name.equals("alertcondition") ||
                       name.equals("indicator") ||
                       name.equals("study") ||
                       name.startsWith("table.") ||
                       name.startsWith("line.") ||
                       name.startsWith("box.") ||
                       name.startsWith("label.");
            }
            return false;
        }

        private void skipStatementCall() {
            advance(); // consume function identifier
            if (match(TokenType.LPAREN)) {
                int depth = 1;
                while (depth > 0 && !isAtEnd()) {
                    if (check(TokenType.LPAREN)) depth++;
                    else if (check(TokenType.RPAREN)) depth--;
                    advance();
                }
            }
        }

        private Object parseCondition() {
            return parseLogicalOr(0);
        }

        private Object parseLogicalOr(int depth) {
            checkDepth(depth);
            Object left = parseLogicalAnd(depth + 1);

            while (match(TokenType.OR)) {
                Object right = parseLogicalAnd(depth + 1);
                left = combineRules("OR", toRuleMap(left), toRuleMap(right));
            }
            return left;
        }

        private Object parseLogicalAnd(int depth) {
            checkDepth(depth);
            Object left = parseUnaryNot(depth + 1);

            while (match(TokenType.AND)) {
                Object right = parseUnaryNot(depth + 1);
                left = combineRules("AND", toRuleMap(left), toRuleMap(right));
            }
            return left;
        }

        private Object parseUnaryNot(int depth) {
            checkDepth(depth);
            if (match(TokenType.NOT)) {
                Object inner = parseUnaryNot(depth + 1);
                return Map.of("type", "NOT", "rule", toRuleMap(inner));
            }
            return parseComparison(depth + 1);
        }

        private Object parseComparison(int depth) {
            checkDepth(depth);
            Object left = parseExpression();

            if (match(TokenType.GT)) {
                Object right = parseExpression();
                return Map.of("type", "GREATER_THAN", "left", toIndicatorMap(left), "right", toIndicatorMap(right));
            } else if (match(TokenType.LT)) {
                Object right = parseExpression();
                return Map.of("type", "LESS_THAN", "left", toIndicatorMap(left), "right", toIndicatorMap(right));
            } else if (match(TokenType.GTE)) {
                Object right = parseExpression();
                return Map.of("type", "GREATER_EQUAL", "left", toIndicatorMap(left), "right", toIndicatorMap(right));
            } else if (match(TokenType.LTE)) {
                Object right = parseExpression();
                return Map.of("type", "LESS_EQUAL", "left", toIndicatorMap(left), "right", toIndicatorMap(right));
            } else if (match(TokenType.EQ)) {
                Object right = parseExpression();
                return Map.of("type", "EQ", "left", toIndicatorMap(left), "right", toIndicatorMap(right));
            } else if (match(TokenType.NEQ)) {
                Object right = parseExpression();
                return Map.of("type", "NOT", "rule", Map.of("type", "EQ", "left", toIndicatorMap(left), "right", toIndicatorMap(right)));
            }

            return left;
        }

        private Object parseExpression() {
            incrementNodes();
            Token t = peek();

            // input functions
            if (isInputCall()) {
                return parseInputCall();
            }

            // timestamp(...)
            if (matchIdentifier("timestamp")) {
                return parseTimestampCall();
            }

            // ta.crossover(a, b) / crossover(a, b)
            if (matchIdentifier("ta.crossover") || matchIdentifier("crossover")) {
                consume(TokenType.LPAREN, "Expected '(' after crossover");
                Object left = parseExpression();
                consume(TokenType.COMMA, "Expected ','");
                Object right = parseExpression();
                consume(TokenType.RPAREN, "Expected ')'");
                return Map.of("type", "CROSSED_UP", "left", toIndicatorMap(left), "right", toIndicatorMap(right));
            }

            // ta.crossunder(a, b) / crossunder(a, b)
            if (matchIdentifier("ta.crossunder") || matchIdentifier("crossunder")) {
                consume(TokenType.LPAREN, "Expected '(' after crossunder");
                Object left = parseExpression();
                consume(TokenType.COMMA, "Expected ','");
                Object right = parseExpression();
                consume(TokenType.RPAREN, "Expected ')'");
                return Map.of("type", "CROSSED_DOWN", "left", toIndicatorMap(left), "right", toIndicatorMap(right));
            }

            // ta.sma / sma
            if (matchIdentifier("ta.sma") || matchIdentifier("sma")) {
                return parseSingleOrTwoArgIndicator("SMA");
            }

            // ta.ema / ema
            if (matchIdentifier("ta.ema") || matchIdentifier("ema")) {
                return parseSingleOrTwoArgIndicator("EMA");
            }

            // ta.rsi / rsi
            if (matchIdentifier("ta.rsi") || matchIdentifier("rsi")) {
                return parseSingleOrTwoArgIndicator("RSI");
            }

            // ta.macd / macd
            if (matchIdentifier("ta.macd") || matchIdentifier("macd")) {
                return parseMacdCall();
            }

            // ta.bb / bb
            if (matchIdentifier("ta.bb") || matchIdentifier("bb")) {
                return parseBollingerBandsCall();
            }

            // ta.atr / atr
            if (matchIdentifier("ta.atr") || matchIdentifier("atr")) {
                consume(TokenType.LPAREN, "Expected '(' after atr");
                Object pExpr = parseExpression();
                int period = toInt(pExpr, 14);
                consume(TokenType.RPAREN, "Expected ')'");
                updateMaxPeriod(period);
                return Map.of("indicator", "ATR", "period", period);
            }

            // na(x) null check - return true / false harmlessly
            if (matchIdentifier("na")) {
                skipParentheses();
                return Boolean.FALSE;
            }

            // Number literal
            if (t.type() == TokenType.NUMBER) {
                advance();
                return Double.parseDouble(t.text());
            }

            // Boolean literals
            if (t.type() == TokenType.TRUE) {
                advance();
                return Boolean.TRUE;
            }
            if (t.type() == TokenType.FALSE) {
                advance();
                return Boolean.FALSE;
            }

            // String literal
            if (t.type() == TokenType.STRING) {
                advance();
                return t.text();
            }

            // Identifier lookup
            if (t.type() == TokenType.IDENTIFIER) {
                advance();
                String id = t.text();
                String lower = id.toLowerCase();

                if (symbolVariables.containsKey(id)) {
                    return symbolVariables.get(id);
                }

                return switch (lower) {
                    case "close" -> Map.of("indicator", "CLOSE");
                    case "open" -> Map.of("indicator", "OPEN");
                    case "high" -> Map.of("indicator", "HIGH");
                    case "low" -> Map.of("indicator", "LOW");
                    case "volume" -> Map.of("indicator", "VOLUME");
                    case "hl2" -> Map.of("indicator", "HL2");
                    case "hlc3" -> Map.of("indicator", "HLC3");
                    case "ohlc4" -> Map.of("indicator", "CLOSE");
                    case "time" -> Map.of("indicator", "TIME");
                    case "strategy.long" -> "LONG";
                    case "strategy.short" -> "SHORT";
                    default -> Map.of("indicator", "CLOSE");
                };
            }

            // Parenthesized expression
            if (match(TokenType.LPAREN)) {
                Object expr = parseCondition();
                consume(TokenType.RPAREN, "Expected ')'");
                return expr;
            }

            advance();
            return Map.of("indicator", "CLOSE");
        }

        private boolean isInputCall() {
            if (check(TokenType.IDENTIFIER)) {
                String name = peek().text().toLowerCase();
                return name.equals("input") ||
                       name.equals("input.int") ||
                       name.equals("input.float") ||
                       name.equals("input.bool") ||
                       name.equals("input.string") ||
                       name.equals("input.time") ||
                       name.equals("input.timeframe") ||
                       name.equals("input.resolution") ||
                       name.equals("input.source");
            }
            return false;
        }

        private Object parseTimestampCall() {
            consume(TokenType.LPAREN, "Expected '(' after timestamp");
            List<Object> args = new ArrayList<>();
            while (!check(TokenType.RPAREN) && !isAtEnd()) {
                args.add(parseExpression());
                match(TokenType.COMMA);
            }
            consume(TokenType.RPAREN, "Expected ')' after timestamp arguments");

            if (args.isEmpty()) {
                return null;
            }

            // Case 1: Single string argument: timestamp("2024-01-01")
            if (args.size() == 1 && args.get(0) instanceof String s) {
                return DateParsingUtils.normalizeToString(s, false);
            }

            // Case 2: Timezone as first string arg, followed by numbers: timestamp("GMT", 2024, 1, 1, 0, 0)
            int offset = 0;
            if (args.get(0) instanceof String && args.size() > 1) {
                offset = 1;
            }

            int year = toInt(args.get(offset), 2024);
            int month = (args.size() > offset + 1) ? toInt(args.get(offset + 1), 1) : 1;
            int day = (args.size() > offset + 2) ? toInt(args.get(offset + 2), 1) : 1;
            int hour = (args.size() > offset + 3) ? toInt(args.get(offset + 3), 0) : 0;
            int min = (args.size() > offset + 4) ? toInt(args.get(offset + 4), 0) : 0;
            int sec = (args.size() > offset + 5) ? toInt(args.get(offset + 5), 0) : 0;

            String iso = DateParsingUtils.createTimestamp(year, month, day, hour, min, sec);
            return iso != null ? iso : String.format("%04d-%02d-%02dT%02d:%02d:%02dZ", year, month, day, hour, min, sec);
        }

        private Object parseInputCall() {
            String inputFunc = advance().text();
            consume(TokenType.LPAREN, "Expected '(' after " + inputFunc);
            Object defVal = null;
            boolean isFirst = true;
            while (!check(TokenType.RPAREN) && !isAtEnd()) {
                if (check(TokenType.IDENTIFIER) && peek().text().equalsIgnoreCase("defval") && peekNext().type() == TokenType.EQUALS) {
                    advance(); // defval
                    consume(TokenType.EQUALS, "=");
                    defVal = parseExpression();
                } else if (isFirst && check(TokenType.IDENTIFIER) && peekNext().type() == TokenType.EQUALS) {
                    // e.g. input(title="x", ...)
                    advance();
                    consume(TokenType.EQUALS, "=");
                    parseExpression();
                } else if (isFirst) {
                    defVal = parseExpression();
                    isFirst = false;
                } else {
                    advance();
                }
                match(TokenType.COMMA);
            }
            consume(TokenType.RPAREN, "Expected ')'");
            return defVal != null ? defVal : 14.0;
        }

        private Map<String, Object> parseSingleOrTwoArgIndicator(String indName) {
            consume(TokenType.LPAREN, "Expected '(' after " + indName);
            Object first = parseExpression();
            Object src = Map.of("indicator", "CLOSE");
            int period = 14;

            if (match(TokenType.COMMA)) {
                src = toIndicatorMap(first);
                Object pExpr = parseExpression();
                period = toInt(pExpr, 14);
            } else {
                period = toInt(first, 14);
            }
            consume(TokenType.RPAREN, "Expected ')'");
            updateMaxPeriod(period);
            return Map.of("indicator", indName, "period", period, "source", toIndicatorMap(src));
        }

        private Object parseMacdCall() {
            consume(TokenType.LPAREN, "Expected '(' after macd");
            Object first = parseExpression();
            consume(TokenType.COMMA, "Expected ','");
            Object second = parseExpression();
            consume(TokenType.COMMA, "Expected ','");
            Object third = parseExpression();

            Object src = Map.of("indicator", "CLOSE");
            int fastP = 12;
            int slowP = 26;
            int signalP = 9;

            if (match(TokenType.COMMA)) {
                // (source, fast, slow, signal)
                src = toIndicatorMap(first);
                fastP = toInt(second, 12);
                slowP = toInt(third, 26);
                Object fourth = parseExpression();
                signalP = toInt(fourth, 9);
            } else {
                // (fast, slow, signal)
                fastP = toInt(first, 12);
                slowP = toInt(second, 26);
                signalP = toInt(third, 9);
            }
            consume(TokenType.RPAREN, "Expected ')'");
            updateMaxPeriod(slowP);

            Map<String, Object> macdLine = Map.of("indicator", "MACD", "source", src, "shortPeriod", fastP, "longPeriod", slowP);
            Map<String, Object> signalLine = Map.of("indicator", "MACD_SIGNAL", "source", src, "shortPeriod", fastP, "longPeriod", slowP, "signalPeriod", signalP);
            Map<String, Object> histLine = Map.of("indicator", "MACD", "source", src, "shortPeriod", fastP, "longPeriod", slowP);
            return new TupleResult("MACD", macdLine, signalLine, histLine);
        }

        private Object parseBollingerBandsCall() {
            consume(TokenType.LPAREN, "Expected '(' after bb");
            Object first = parseExpression();
            consume(TokenType.COMMA, "Expected ','");
            Object second = parseExpression();

            Object src = Map.of("indicator", "CLOSE");
            int length = 20;
            double mult = 2.0;

            if (match(TokenType.COMMA)) {
                src = toIndicatorMap(first);
                length = toInt(second, 20);
                Object third = parseExpression();
                mult = toDouble(third, 2.0);
            } else {
                length = toInt(first, 20);
                mult = toDouble(second, 2.0);
            }
            consume(TokenType.RPAREN, "Expected ')'");
            updateMaxPeriod(length);

            Map<String, Object> middle = Map.of("indicator", "BOLLINGER_MIDDLE", "source", src, "period", length);
            Map<String, Object> upper = Map.of("indicator", "BOLLINGER_UPPER", "source", src, "period", length, "multiplier", mult);
            Map<String, Object> lower = Map.of("indicator", "BOLLINGER_LOWER", "source", src, "period", length, "multiplier", mult);
            return new TupleResult("BB", middle, upper, lower);
        }

        private int toInt(Object obj, int defaultVal) {
            if (obj instanceof Number num) {
                return num.intValue();
            }
            return defaultVal;
        }

        private double toDouble(Object obj, double defaultVal) {
            if (obj instanceof Number num) {
                return num.doubleValue();
            }
            return defaultVal;
        }

        private double parseNumber() {
            Token t = consume(TokenType.NUMBER, "Expected number");
            return Double.parseDouble(t.text());
        }

        private void skipParentheses() {
            if (match(TokenType.LPAREN)) {
                int depth = 1;
                while (depth > 0 && !isAtEnd()) {
                    if (check(TokenType.LPAREN)) depth++;
                    else if (check(TokenType.RPAREN)) depth--;
                    advance();
                }
            }
        }

        private void updateMaxPeriod(int p) {
            if (p > maxPeriod) maxPeriod = p;
        }

        @SuppressWarnings("unchecked")
        private Map<String, Object> toRuleMap(Object obj) {
            if (obj instanceof Map<?, ?> map) {
                return (Map<String, Object>) map;
            }
            if (obj instanceof Boolean bool) {
                return Map.of("type", "BOOLEAN", "value", bool);
            }
            return Map.of("type", "BOOLEAN", "value", true);
        }

        private Object toIndicatorMap(Object obj) {
            if (obj instanceof Number num) {
                return num.doubleValue();
            }
            if (obj instanceof TupleResult tuple) {
                return tuple.part1();
            }
            return obj;
        }

        private Map<String, Object> combineRules(String op, Map<String, Object> left, Map<String, Object> right) {
            return Map.of("type", op, "left", left, "right", right);
        }

        private void incrementNodes() {
            nodeCount++;
            if (nodeCount > MAX_NODES) {
                throw new ScriptCompilationException("Script exceeded maximum AST complexity limit (" + MAX_NODES + " nodes)");
            }
        }

        private void checkDepth(int depth) {
            if (depth > MAX_DEPTH) {
                throw new ScriptCompilationException("Script exceeded maximum expression nesting depth (" + MAX_DEPTH + ")");
            }
        }

        private boolean matchIdentifier(String text) {
            if (check(TokenType.IDENTIFIER) && peek().text().equalsIgnoreCase(text)) {
                advance();
                return true;
            }
            return false;
        }

        private boolean match(TokenType type) {
            if (check(type)) {
                advance();
                return true;
            }
            return false;
        }

        private boolean check(TokenType type) {
            if (isAtEnd()) return false;
            return peek().type() == type;
        }

        private Token advance() {
            if (!isAtEnd()) pos++;
            return previous();
        }

        private boolean isAtEnd() {
            return peek().type() == TokenType.EOF;
        }

        private Token peek() {
            return tokens.get(pos);
        }

        private Token peekNext() {
            if (pos + 1 >= tokens.size()) return tokens.get(tokens.size() - 1);
            return tokens.get(pos + 1);
        }

        private Token previous() {
            return tokens.get(pos - 1);
        }

        private Token consume(TokenType type, String errorMsg) {
            if (check(type)) return advance();
            Token t = peek();
            throw new ScriptCompilationException(errorMsg + ", found: '" + t.text() + "'", t.line(), t.col());
        }
    }
}
