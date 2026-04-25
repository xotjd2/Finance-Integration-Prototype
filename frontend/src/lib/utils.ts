import type { DirectionType, InterfaceStatus, ProtocolType, SeverityLevel } from "@/lib/types";

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function formatMinutes(value: number) {
  return `${value.toFixed(1)}분`;
}

export function getStatusTone(status: InterfaceStatus) {
  switch (status) {
    case "HEALTHY":
      return "bg-emerald-100 text-emerald-700";
    case "WARNING":
      return "bg-amber-100 text-amber-700";
    case "FAILED":
      return "bg-rose-100 text-rose-700";
    case "RUNNING":
      return "bg-sky-100 text-sky-700";
    case "PAUSED":
      return "bg-slate-200 text-slate-700";
  }
}

export function getSeverityTone(severity: SeverityLevel) {
  switch (severity) {
    case "CRITICAL":
      return "bg-rose-100 text-rose-700";
    case "MEDIUM":
      return "bg-amber-100 text-amber-700";
    case "LOW":
      return "bg-emerald-100 text-emerald-700";
  }
}

export function getProtocolLabel(protocol: ProtocolType) {
  switch (protocol) {
    case "REST_API":
      return "REST API";
    case "SOAP":
      return "SOAP";
    case "MQ":
      return "MQ";
    case "BATCH":
      return "Batch";
    case "SFTP":
      return "SFTP";
  }
}

export function getDirectionLabel(direction: DirectionType) {
  switch (direction) {
    case "INBOUND":
      return "수신";
    case "OUTBOUND":
      return "송신";
    case "BIDIRECTIONAL":
      return "송수신";
  }
}
