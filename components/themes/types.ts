import { type MonitorStatus } from "@/lib/domain";

export interface ChartDataPoint {
  timestamp: number;
  responseTime: number;
  status: MonitorStatus;
}

export interface Incident {
  id: string;
  title: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  startedAt: Date;
  resolvedAt?: Date;
  updates?: Array<{
    message: string;
    timestamp: Date;
  }>;
}

export interface StatusPageThemeProps {
  monitorName: string;
  status: MonitorStatus;
  uptimePercentage: number | null;
  avgResponseTime: number;
  totalChecks?: number;
  lastCheckAt?: number;
  chartData: ChartDataPoint[];
  incidents: Incident[];
}
