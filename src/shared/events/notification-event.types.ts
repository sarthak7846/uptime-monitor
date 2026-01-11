export enum NotificationEventType {
  MONITOR_DOWN = 'monitor.down',
  MONITOR_UP = 'monitor.up',
}

export interface NotificationEvent {
  id: string;
  type: NotificationEventType;
  userId: string;
  monitorId: string;
  incidentId: string;
  occurredAt: Date;
  data: {
    monitorName: string;
    url: string;
    currentStatus: 'UP' | 'DOWN';
    previousStatus: 'UP' | 'DOWN';
    responseTime?: number;
    errorMessage?: string;
  };
}
