export interface ProbeResult {
  isHealthy: boolean;
  responseMs?: number;
  statusCode?: number;
  reason?: string;
}
