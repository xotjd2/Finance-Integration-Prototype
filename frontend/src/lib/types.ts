export type InterfaceStatus = "HEALTHY" | "WARNING" | "FAILED" | "RUNNING" | "PAUSED";

export type ProtocolType = "REST_API" | "SOAP" | "MQ" | "BATCH" | "SFTP";

export type DirectionType = "INBOUND" | "OUTBOUND" | "BIDIRECTIONAL";

export type SeverityLevel = "CRITICAL" | "MEDIUM" | "LOW";

export type InterfaceConfig = {
  endpoint: string;
  sourceSystem: string;
  targetSystem: string;
  authType: string;
  payloadFormat: string;
  retryPolicy: string;
  scheduleExpression: string;
  ownerTeam: string;
};

export type InterfaceItem = {
  id: string;
  name: string;
  organization: string;
  protocol: ProtocolType;
  direction: DirectionType;
  schedule: string;
  status: InterfaceStatus;
  successRate: number;
  slaPercent: number;
  avgLatencyMs: number;
  avgProcessMinutes: number;
  todayCount: number;
  retryCount: number;
  queueDepth: number;
  lastRunAt: string;
  lastResult: string;
  errorSummary: string;
  operatorNote: string;
  description: string;
  config: InterfaceConfig;
};

export type IncidentItem = {
  severity: SeverityLevel;
  title: string;
  detail: string;
  occurredAt: string;
};

export type ProtocolSummary = {
  label: string;
  value: number;
  share: number;
};

export type PerformancePoint = {
  label: string;
  value: number;
};

export type TimelineEvent = {
  time: string;
  title: string;
  detail: string;
};

export type DashboardSummary = {
  totalInterfaces: number;
  failed: number;
  warning: number;
  running: number;
  healthy: number;
  totalTransactions: number;
  avgLatency: number;
  avgSlaRate: number;
};

export type DashboardResponse = {
  summary: DashboardSummary;
  interfaces: InterfaceItem[];
  incidents: IncidentItem[];
  protocolBreakdown: ProtocolSummary[];
  performanceSeries: PerformancePoint[];
  timelineEvents: TimelineEvent[];
};

export type InterfaceFormValues = {
  name: string;
  organization: string;
  protocol: ProtocolType;
  direction: DirectionType;
  schedule: string;
  description: string;
  endpoint: string;
  sourceSystem: string;
  targetSystem: string;
  authType: string;
  payloadFormat: string;
  retryPolicy: string;
  scheduleExpression: string;
  ownerTeam: string;
  operatorNote: string;
};
