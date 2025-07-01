interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  userId?: string;
  data: any;
  userAgent: string;
  ip: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private readonly maxLogs = 1000;

  constructor() {
    // Load existing logs from localStorage
    const savedLogs = localStorage.getItem('app-logs');
    if (savedLogs) {
      try {
        this.logs = JSON.parse(savedLogs);
      } catch (error) {
        console.error('Error loading logs:', error);
        this.logs = [];
      }
    }
  }

  log(action: string, data: any = {}) {
    const logEntry: LogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      action,
      data,
      userAgent: navigator.userAgent,
      ip: 'localhost', // In a real app, this would be determined by backend
    };

    this.logs.unshift(logEntry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Save to localStorage
    try {
      localStorage.setItem('app-logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Error saving logs:', error);
    }

    // Also log to console in development
    if (import.meta.env.DEV) {
      console.log(`[${action}]`, data);
    }
  }

  getLogs(limit?: number): LogEntry[] {
    return limit ? this.logs.slice(0, limit) : this.logs;
  }

  getLogsByAction(action: string): LogEntry[] {
    return this.logs.filter(log => log.action === action);
  }

  getLogsByUser(userId: string): LogEntry[] {
    return this.logs.filter(log => log.data.userId === userId);
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem('app-logs');
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

const logger = new Logger();

export const logAction = (action: string, data?: any) => {
  logger.log(action, data);
};

export const getLogs = (limit?: number) => {
  return logger.getLogs(limit);
};

export const getLogsByAction = (action: string) => {
  return logger.getLogsByAction(action);
};

export const getLogsByUser = (userId: string) => {
  return logger.getLogsByUser(userId);
};

export const clearLogs = () => {
  logger.clearLogs();
};

export const exportLogs = () => {
  return logger.exportLogs();
};