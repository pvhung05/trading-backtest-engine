/**
 * Lightweight STOMP over WebSocket Client for Realtime Market Data.
 * Connects directly to API Gateway /ws/market and handles pub/sub for
 * live candlestick updates (/topic/chart/{symbol}/{interval}) and
 * watchlist tickers (/topic/watchlist).
 */

export interface RealtimeKline {
  symbol: string;
  interval: string;
  openTime: number;
  open: string | number;
  high: string | number;
  low: string | number;
  close: string | number;
  volume: string | number;
  closeTime: number;
  isClosed?: boolean;
}

export interface RealtimeTicker {
  symbol: string;
  lastPrice: string | number;
  priceChange: string | number;
  priceChangePercent: string | number;
  highPrice: string | number;
  lowPrice: string | number;
  volume: string | number;
  quoteVolume: string | number;
  updateTime: number;
}

type MessageCallback<T = any> = (data: T) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private isConnecting = false;
  private reconnectTimer: number | null = null;
  private subCounter = 0;

  // Track subscriptions: dest -> Set of callbacks
  private topicListeners: Map<string, Set<MessageCallback>> = new Map();
  // Track STOMP subscription IDs: dest -> subId
  private activeSubscriptions: Map<string, string> = new Map();
  // Connection status listeners
  private statusListeners: Set<(connected: boolean) => void> = new Set();

  private getWsUrl(): string {
    const customUrl = import.meta.env.VITE_WS_BASE_URL;
    if (customUrl) return customUrl;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    return `${protocol}//${host}:8080/ws/market`;
  }

  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    const wsUrl = this.getWsUrl();

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        // Send STOMP CONNECT frame
        const connectFrame = 'CONNECT\naccept-version:1.1,1.2\nheart-beat:10000,10000\n\n\0';
        this.socket?.send(connectFrame);
      };

      this.socket.onmessage = (event: MessageEvent) => {
        const raw = event.data as string;
        this.handleFrame(raw);
      };

      this.socket.onclose = () => {
        this.setConnected(false);
        this.scheduleReconnect();
      };

      this.socket.onerror = (err) => {
        console.warn('[WebSocketService] Error:', err);
      };
    } catch (err) {
      console.error('[WebSocketService] Failed to establish connection:', err);
      this.setConnected(false);
      this.scheduleReconnect();
    }
  }

  private handleFrame(data: string): void {
    if (data.includes('CONNECTED')) {
      this.setConnected(true);
      // Re-subscribe all active topics on reconnect
      this.resubscribeAll();
      return;
    }

    if (data.includes('MESSAGE')) {
      const parts = data.split('\n\n');
      if (parts.length >= 2) {
        const headers = parts[0];
        const body = parts.slice(1).join('\n\n').replace(/\0/g, '');

        // Extract destination from headers
        const destMatch = headers.match(/destination:(.+)/);
        const destination = destMatch ? destMatch[1].trim() : '';

        try {
          const parsed = JSON.parse(body);
          this.notifySubscribers(destination, parsed);
        } catch (e) {
          console.error('[WebSocketService] Error parsing JSON frame:', e);
        }
      }
    }
  }

  private notifySubscribers(destination: string, data: any): void {
    // Exact match
    const listeners = this.topicListeners.get(destination);
    if (listeners) {
      listeners.forEach((cb) => cb(data));
    }

    // Pattern match for user/queue or wildcard topics if needed
    for (const [topic, cbs] of this.topicListeners.entries()) {
      if (topic !== destination && this.matchTopic(topic, destination)) {
        cbs.forEach((cb) => cb(data));
      }
    }
  }

  private matchTopic(pattern: string, actual: string): boolean {
    if (pattern === actual) return true;
    if (pattern.endsWith('/**')) {
      const prefix = pattern.slice(0, -3);
      return actual.startsWith(prefix);
    }
    return false;
  }

  private setConnected(status: boolean): void {
    this.isConnected = status;
    this.isConnecting = false;
    this.statusListeners.forEach((fn) => fn(status));
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  private resubscribeAll(): void {
    this.activeSubscriptions.clear();
    for (const destination of this.topicListeners.keys()) {
      this.sendStompSubscribe(destination);
    }
  }

  private sendStompSubscribe(destination: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.isConnected) {
      return;
    }

    if (this.activeSubscriptions.has(destination)) return;

    const subId = `sub-${++this.subCounter}-${Date.now()}`;
    this.activeSubscriptions.set(destination, subId);

    const frame = `SUBSCRIBE\nid:${subId}\ndestination:${destination}\n\n\0`;
    this.socket.send(frame);
  }

  private sendStompUnsubscribe(destination: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    const subId = this.activeSubscriptions.get(destination);
    if (subId) {
      const frame = `UNSUBSCRIBE\nid:${subId}\n\n\0`;
      this.socket.send(frame);
      this.activeSubscriptions.delete(destination);
    }
  }

  public subscribe<T = any>(destination: string, callback: MessageCallback<T>): () => void {
    if (!this.topicListeners.has(destination)) {
      this.topicListeners.set(destination, new Set());
    }

    this.topicListeners.get(destination)!.add(callback);

    if (this.isConnected) {
      this.sendStompSubscribe(destination);
    } else {
      this.connect();
    }

    return () => {
      this.unsubscribe(destination, callback);
    };
  }

  public unsubscribe(destination: string, callback: MessageCallback): void {
    const listeners = this.topicListeners.get(destination);
    if (!listeners) return;

    listeners.delete(callback);
    if (listeners.size === 0) {
      this.topicListeners.delete(destination);
      this.sendStompUnsubscribe(destination);
    }
  }

  /**
   * Subscribe specifically to chart candlestick updates.
   * Sends both STOMP SUBSCRIBE and /app/chart/subscribe action to backend.
   */
  public subscribeChart(
    symbol: string,
    interval: string,
    callback: MessageCallback<RealtimeKline>
  ): () => void {
    const sym = symbol.toUpperCase().replace('/', '');
    const destination = `/topic/chart/${sym}/${interval}`;

    const unsubTopic = this.subscribe<RealtimeKline>(destination, callback);

    // Send subscribe notification to backend application endpoint
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.isConnected) {
      const reqPayload = JSON.stringify({ symbol: sym, interval });
      const frame = `SEND\ndestination:/app/chart/subscribe\ncontent-type:application/json\ncontent-length:${reqPayload.length}\n\n${reqPayload}\0`;
      this.socket.send(frame);
    }

    return () => {
      unsubTopic();
      // Send unsubscribe notification to backend
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        const unframe = `SEND\ndestination:/app/chart/unsubscribe/${sym}/${interval}\n\n\0`;
        this.socket.send(unframe);
      }
    };
  }

  /**
   * Subscribe to market watchlist updates.
   */
  public subscribeWatchlist(callback: MessageCallback<RealtimeTicker | RealtimeTicker[]>): () => void {
    return this.subscribe<RealtimeTicker | RealtimeTicker[]>('/topic/watchlist', callback);
  }

  /**
   * Add listener for connection status changes.
   */
  public onConnectionChange(fn: (connected: boolean) => void): () => void {
    this.statusListeners.add(fn);
    fn(this.isConnected);
    return () => this.statusListeners.delete(fn);
  }

  public getConnectedStatus(): boolean {
    return this.isConnected;
  }
}

export const websocketService = new WebSocketService();
