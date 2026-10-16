import { apiFetch } from './apiClient';

export interface PlotDefinition {
  title: string;
  indicator: string;
  period?: number;
  color?: string;
  linewidth?: number;
}

export interface CompileScriptResponse {
  success: boolean;
  strategyTitle?: string;
  warmupBarsRequired?: number;
  complexityScore?: number;
  sourceHash?: string;
  entryRule?: Record<string, any>;
  exitRule?: Record<string, any>;
  startTime?: string;
  endTime?: string;
  timeframe?: string;
  plots?: PlotDefinition[];
  error?: string;
  line?: number;
  column?: number;
}

export interface ScriptSummary {
  id: string;
  title: string;
  description?: string;
  latestVersion: number;
  visibility: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScriptDetail {
  id: string;
  title: string;
  description?: string;
  latestVersion: number;
  visibility: string;
  sourceCode: string;
  warmupBarsRequired?: number;
  complexityScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScriptJobResponse {
  id: string;
  jobId?: string;
  userId: number;
  scriptId?: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  symbol: string;
  timeframe: string;
  startTime: string;
  endTime: string;
  initialCapital: number;
  commissionRate: number;
  slippageRate: number;
  positionSizePercent: number;
  backtestRunId?: number;
  result?: any;
  resultPayload?: string;
  errorCode?: string;
  errorMessage?: string;
  durationMs?: number;
  createdAt: string;
  completedAt?: string;
}

export const scriptService = {
  /**
   * Dry-run compile a script to check syntax without saving.
   */
  async compile(sourceCode: string): Promise<CompileScriptResponse> {
    return apiFetch<CompileScriptResponse>('/api/scripts/compile', {
      method: 'POST',
      body: JSON.stringify({ sourceCode }),
    });
  },

  /**
   * List saved scripts for current user.
   */
  async listScripts(page = 0, size = 20): Promise<ScriptSummary[]> {
    try {
      return await apiFetch<ScriptSummary[]>(`/api/scripts?page=${page}&size=${size}`);
    } catch (err) {
      console.warn('Failed to load user scripts from backend, returning empty list', err);
      return [];
    }
  },

  /**
   * Get specific script by ID with code.
   */
  async getScript(id: string): Promise<ScriptDetail> {
    return apiFetch<ScriptDetail>(`/api/scripts/${id}`);
  },

  /**
   * Create a new script.
   */
  async createScript(title: string, sourceCode: string, description?: string): Promise<ScriptDetail> {
    return apiFetch<ScriptDetail>('/api/scripts', {
      method: 'POST',
      body: JSON.stringify({
        title,
        sourceCode,
        description: description || 'Created in Pine Editor',
        visibility: 'PRIVATE',
      }),
    });
  },

  /**
   * Update an existing script.
   */
  async updateScript(id: string, title: string, sourceCode: string, changelog?: string): Promise<ScriptDetail> {
    return apiFetch<ScriptDetail>(`/api/scripts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title,
        sourceCode,
        changelog: changelog || 'Updated in Pine Editor',
      }),
    });
  },

  /**
   * Delete a script.
   */
  async deleteScript(id: string): Promise<void> {
    return apiFetch<void>(`/api/scripts/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Run backtest directly with raw script code.
   */
  async runDirect(params: {
    sourceCode: string;
    symbol: string;
    timeframe: string;
    startTime: string;
    endTime?: string;
    initialCapital?: number;
  }): Promise<ScriptJobResponse> {
    const raw = await apiFetch<any>('/api/scripts/run-direct', {
      method: 'POST',
      body: JSON.stringify({
        sourceCode: params.sourceCode,
        symbol: params.symbol,
        timeframe: params.timeframe,
        startTime: params.startTime,
        endTime: params.endTime || new Date().toISOString(),
        initialCapital: params.initialCapital || 10000.0,
        commissionRate: 0.001,
        slippageRate: 0.0005,
        positionSizePercent: 100.0,
      }),
    });
    return {
      ...raw,
      id: raw.jobId || raw.id,
      jobId: raw.jobId || raw.id,
    };
  },

  /**
   * Get job status by ID.
   */
  async getJob(jobId: string): Promise<ScriptJobResponse> {
    const raw = await apiFetch<any>(`/api/scripts/jobs/${jobId}`);
    return {
      ...raw,
      id: raw.jobId || raw.id,
      jobId: raw.jobId || raw.id,
    };
  },

  /**
   * Poll job until COMPLETED or FAILED (max 30s).
   */
  async pollJobUntilDone(
    jobId: string,
    onProgress?: (job: ScriptJobResponse) => void
  ): Promise<ScriptJobResponse> {
    const startTime = Date.now();
    const timeoutMs = 35000;

    while (Date.now() - startTime < timeoutMs) {
      const job = await this.getJob(jobId);
      onProgress?.(job);

      if (job.status === 'COMPLETED' || job.status === 'FAILED' || job.status === 'CANCELLED') {
        return job;
      }

      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    throw new Error('Script backtest job timed out after 35 seconds');
  },
};
