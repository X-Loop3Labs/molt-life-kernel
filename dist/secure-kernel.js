"use strict";
/**
 * SecureMoltKernel - Simple Security Wrapper
 * Adds rate limiting, input sanitization, and audit logging
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureMoltKernel = void 0;
const kernel_1 = require("./kernel");
// ============================================================================
// RATE LIMITER
// ============================================================================
class RateLimiter {
    constructor() {
        this.calls = new Map();
    }
    check(operation, config) {
        const now = Date.now();
        const key = operation;
        if (!this.calls.has(key)) {
            this.calls.set(key, []);
        }
        const calls = this.calls.get(key);
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
    static sanitize(input) {
        if (typeof input === 'string') {
            return this.sanitizeString(input);
        }
        if (Array.isArray(input)) {
            return input.map(item => this.sanitize(item));
        }
        if (typeof input === 'object' && input !== null) {
            const sanitized = {};
            for (const key in input) {
                sanitized[key] = this.sanitize(input[key]);
            }
            return sanitized;
        }
        return input;
    }
    static sanitizeString(str) {
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
    static validate(action) {
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
InputSanitizer.DANGEROUS_PATTERNS = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\(/gi,
    /Function\(/gi,
];
// ============================================================================
// SECURE KERNEL
// ============================================================================
class SecureMoltKernel extends kernel_1.MoltLifeKernel {
    constructor(config = {}) {
        super(config);
        this.auditLog = [];
        // Rate limit configs per operation
        this.rateLimits = {
            append: { maxCalls: 1000, windowMs: 60000 },
            witness: { maxCalls: 100, windowMs: 60000 },
            heartbeat: { maxCalls: 60, windowMs: 3600000 },
            molt: { maxCalls: 10, windowMs: 3600000 },
            rehydrate: { maxCalls: 100, windowMs: 60000 },
            enforceCoherence: { maxCalls: 1000, windowMs: 60000 }
        };
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
    append(action) {
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
    async witness(action, timeout) {
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
    async heartbeat() {
        return this.executeSecure('heartbeat', async () => {
            await super.heartbeat();
            this.audit('heartbeat', true);
        });
    }
    async molt() {
        return this.executeSecure('molt', async () => {
            await super.molt();
            this.audit('molt', true);
        });
    }
    enforceCoherence(windowSize) {
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
    executeSecure(operation, fn) {
        // Rate limit check
        const config = this.rateLimits[operation];
        if (config && !this.rateLimiter.check(operation, config)) {
            this.securityMetrics.rate_limit_violations++;
            this.audit(operation, false, { reason: 'rate_limit' });
            throw new Error(`Rate limit exceeded for ${operation}`);
        }
        try {
            return fn();
        }
        catch (error) {
            this.securityMetrics.security_errors++;
            this.audit(operation, false, { error: error.message });
            throw error;
        }
    }
    audit(operation, success, details) {
        const event = {
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
    getSecurityMetrics() {
        return { ...this.securityMetrics };
    }
    getAuditLog(limit = 100) {
        return this.auditLog.slice(-limit);
    }
    getMetrics() {
        const baseMetrics = super.getMetrics();
        return {
            ...baseMetrics,
            security: this.getSecurityMetrics()
        };
    }
}
exports.SecureMoltKernel = SecureMoltKernel;
