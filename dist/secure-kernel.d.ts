/**
 * SecureMoltKernel - Simple Security Wrapper
 * Adds rate limiting, input sanitization, and audit logging
 */
import { MoltLifeKernel, Action, KernelConfig, KernelMetrics } from './kernel';
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
export declare class SecureMoltKernel extends MoltLifeKernel {
    private rateLimiter;
    private auditLog;
    private securityMetrics;
    private rateLimits;
    constructor(config?: KernelConfig);
    append(action: Action): void;
    witness(action: Action, timeout?: number): Promise<boolean>;
    heartbeat(): Promise<void>;
    molt(): Promise<void>;
    enforceCoherence(windowSize: number): void;
    private executeSecure;
    private audit;
    getSecurityMetrics(): SecurityMetrics;
    getAuditLog(limit?: number): AuditEvent[];
    getMetrics(): KernelMetrics & {
        security: SecurityMetrics;
    };
}
export {};
