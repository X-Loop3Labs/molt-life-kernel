/**
 * SecureMoltKernel - Simple Security Wrapper
 * Adds rate limiting, input sanitization, and audit logging
 */

import { MoltLifeKernel, Action, KernelConfig, KernelMetrics } from './kernel';

// ============================================================================
// SECURITY TYPES
// ============================================================================

interface RateLimitConfig {
  maxCalls: number;
  windowMs: number;
}

interface SecurityMetrics {
  rate_limit_violations: number;
  sanitization_blocks: number;
  audit_events: number;
  security_errors: number;
}

interface AuditEvent {
  timestamp: number;
  operation: string;
  success: boolean;
  details?: any;
}

// ============================================================================
// RATE LIMITER
// ============================================================================

class RateLimiter {
  private calls: Map<string, number[]> = new Map();

  check(operation: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const key = operation;
    
    if (!this.calls.has(key)) {
      this.calls.set(key, []);
    }
    
    const calls = this.calls.get(key)!;
    
    // Remove old calls outside window
    const validCalls = calls.filter(time => now - time < config.windowMs);
    this.calls.set(key, validCalls);
    
    // Check if limit exceeded
    if (validCalls.length >= config.maxCalls) {
      return false; // Rate limit exceeded
    }
    
    // Add this call
    validCalls.push(now);
    return true;
  }
}

// ============================================================================
// INPUT SANITIZER
// ============================================================================

class InputSanitizer {
  private static DANGEROUS_PATTERNS = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\(/gi,
    /Function\(/gi,
  ];

  static sanitize(input: any): any {
    if (typeof input === 'string') {
      return this.sanitizeString(input);
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitize(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const key in input) {
        sanitized[key] = this.sanitize(input[key]);
      }
      return sanitized;
    }
    
    return input;
  }

  private static sanitizeString(str: string): string {
    let clean = str;
    
    // Remove dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      clean = clean.replace(pattern, '');
    }
    
    // Basic HTML escape
    clean = clean
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
    
    return clean;
  }

  static validate(action: Action): boolean {
    // Type validation
    if (!action.type || typeof action.type !== 'string') {
      return false;
    }
    
    // Length check
    if (action.type.length > 100) {
      return false;
    }
    
    // Risk bounds
    if (action.risk !== undefined) {
      if (typeof action.risk !== 'number' || action.risk < 0 || action.risk > 1) {
        return false;
      }
    }
    
    return true;
  }
}

// ============================================================================
// SECURE KERNEL
// ============================================================================

export class SecureMoltKernel extends MoltLifeKernel {
  private rateLimiter: RateLimiter;
  private auditLog: AuditEvent[] = [];
  private securityMetrics: SecurityMetrics;
  
  // Rate limit configs per operation
  private rateLimits = {
    append: { maxCalls: 1000, windowMs: 60000 },
    witness: { maxCalls: 100, windowMs: 60000 },
    heartbeat: { maxCalls: 60, windowMs: 3600000 },
    molt: { maxCalls: 10, windowMs: 3600000 },
    rehydrate: { maxCalls: 100, windowMs: 60000 },
    enforceCoherence: { maxCalls: 1000, windowMs: 60000 }
  };

  constructor(config: KernelConfig = {}) {
    super(config);
    this.rateLimiter = new RateLimiter();
    this.securityMetrics = {
      rate_limit_violations: 0,
      sanitization_blocks: 0,
      audit_events: 0,
      security_errors: 0
    };
  }

  // ==========================================================================
  // SECURED OPERATIONS
  // ==========================================================================

  append(action: Action): void {
    this.executeSecure('append', () => {
      // Validate
      if (!InputSanitizer.validate(action)) {
        this.securityMetrics.sanitization_blocks++;
        throw new Error('Input validation failed');
      }
      
      // Sanitize
      const sanitized = InputSanitizer.sanitize(action);
      
      // Call parent
      super.append(sanitized);
      
      this.audit('append', true);
    });
  }

  async witness(action: Action, timeout?: number): Promise<boolean> {
    return this.executeSecure('witness', async () => {
      // Validate
      if (!InputSanitizer.validate(action)) {
        this.securityMetrics.sanitization_blocks++;
        throw new Error('Input validation failed');
      }
      
      // Sanitize
      const sanitized = InputSanitizer.sanitize(action);
      
      // Call parent
      const result = await super.witness(sanitized, timeout);
      
      this.audit('witness', true, { approved: result });
      return result;
    });
  }

  async heartbeat(): Promise<void> {
    return this.executeSecure('heartbeat', async () => {
      await super.heartbeat();
      this.audit('heartbeat', true);
    });
  }

  async molt(): Promise<void> {
    return this.executeSecure('molt', async () => {
      await super.molt();
      this.audit('molt', true);
    });
  }

  enforceCoherence(windowSize: number): void {
    this.executeSecure('enforceCoherence', () => {
      // Bounds check
      if (windowSize < 1 || windowSize > 1000) {
        throw new Error('Window size out of bounds (1-1000)');
      }
      
      super.enforceCoherence(windowSize);
      this.audit('enforceCoherence', true);
    });
  }

  // ==========================================================================
  // SECURITY HELPERS
  // ==========================================================================

  private executeSecure<T>(operation: string, fn: () => T): T {
    // Rate limit check
    const config = this.rateLimits[operation as keyof typeof this.rateLimits];
    if (config && !this.rateLimiter.check(operation, config)) {
      this.securityMetrics.rate_limit_violations++;
      this.audit(operation, false, { reason: 'rate_limit' });
      throw new Error(`Rate limit exceeded for ${operation}`);
    }

    try {
      return fn();
    } catch (error) {
      this.securityMetrics.security_errors++;
      this.audit(operation, false, { error: (error as Error).message });
      throw error;
    }
  }

  private audit(operation: string, success: boolean, details?: any): void {
    const event: AuditEvent = {
      timestamp: Date.now(),
      operation,
      success,
      details
    };
    
    this.auditLog.push(event);
    this.securityMetrics.audit_events++;
    
    // Keep only last 1000 events
    if (this.auditLog.length > 1000) {
      this.auditLog.shift();
    }
    
    console.log(`🛡️  Audit: ${operation} - ${success ? 'OK' : 'FAILED'}`, details || '');
  }

  // ==========================================================================
  // ENHANCED METRICS
  // ==========================================================================

  getSecurityMetrics(): SecurityMetrics {
    return { ...this.securityMetrics };
  }

  getAuditLog(limit: number = 100): AuditEvent[] {
    return this.auditLog.slice(-limit);
  }

  getMetrics(): KernelMetrics & { security: SecurityMetrics } {
    const baseMetrics = super.getMetrics();
    return {
      ...baseMetrics,
      security: this.getSecurityMetrics()
    };
  }
}