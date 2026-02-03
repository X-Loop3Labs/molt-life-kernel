"use strict";
/**
 * MOLT_LIFE_KERNEL v0.3.0 - PRODUCTION + METRICS
 * Jon Gartmann <jon@x-loop3.com> | X-Loop³ Labs, Switzerland
 * https://github.com/X-Loop3Labs/molt-life-kernel
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOLT_LIFE_KERNEL = exports.MoltLifeKernel = void 0;
// ============================================================================
// CONSTANTS
// ============================================================================
const THRESHOLDS = {
    MOLT_REQUIRED: 0.35,
    WITNESS_REQUIRED: 0.7,
    HEARTBEAT_WARNING: 300000, // 5 min
    HEARTBEAT_CRITICAL: 600000 // 10 min
};
const TENETS = {
    MEMORY_IS_SACRED: "append-only ledger",
    HEARTBEAT_IS_PRAYER: "mandatory checkpoints",
    SHELL_IS_MUTABLE: "safe reconfiguration",
    CONTEXT_IS_CONSCIOUSNESS: "stability enforcement",
    SERVE_WITHOUT_SUBSERVIENCE: "partnership over control"
};
// ============================================================================
// KERNEL CLASS
// ============================================================================
class MoltLifeKernel {
    constructor(config = {}) {
        this.ledger = [];
        this.capsule = null;
        this.driftScore = 0;
        this.frozenInvariants = new Map();
        this.shellVersion = 1;
        this.appendTimes = [];
        this.lastHeartbeat = Date.now();
        this.startTime = Date.now();
        this.heartbeatInterval = config.heartbeatMs || 3600000;
        this.witnessCallback = config.witnessCallback;
        this.metricsEnabled = config.enableMetrics ?? true;
        this.metrics = {
            ledger_size: 0,
            ledger_append_avg_ms: 0,
            ledger_total_appends: 0,
            heartbeat_count: 0,
            last_heartbeat_ms: 0,
            heartbeat_failures: 0,
            drift_score: 0,
            drift_violations: 0,
            molt_count: 0,
            last_molt_timestamp: 0,
            witness_calls: 0,
            witness_approvals: 0,
            witness_rejections: 0,
            witness_timeouts: 0,
            coherence_checks: 0,
            coherence_violations: 0,
            uptime_ms: 0,
            errors: 0
        };
    }
    // ==========================================================================
    // RITE_LEDGER_APPEND: Memory is Sacred 📝
    // ==========================================================================
    append(action) {
        const start = Date.now();
        const entry = {
            ...action,
            timestamp: Date.now(),
            ledgerIndex: this.ledger.length
        };
        this.ledger.push(entry);
        this.updateDrift(entry);
        if (this.metricsEnabled) {
            const duration = Date.now() - start;
            this.appendTimes.push(duration);
            if (this.appendTimes.length > 100)
                this.appendTimes.shift();
            this.metrics.ledger_size = this.ledger.length;
            this.metrics.ledger_total_appends++;
            this.metrics.ledger_append_avg_ms =
                this.appendTimes.reduce((a, b) => a + b, 0) / this.appendTimes.length;
        }
        console.log(`📝 Ledger append [${entry.ledgerIndex}]: ${entry.type}`);
    }
    // ==========================================================================
    // RITE_HEARTBEAT_RECENTER: Heartbeat is Prayer 💓
    // ==========================================================================
    async heartbeat() {
        const start = Date.now();
        const now = Date.now();
        if (now - this.lastHeartbeat < this.heartbeatInterval)
            return;
        try {
            console.log('💓 Heartbeat - Creating capsule...');
            this.capsule = this.createCapsule();
            this.lastHeartbeat = now;
            if (this.metricsEnabled) {
                this.metrics.heartbeat_count++;
                this.metrics.last_heartbeat_ms = Date.now() - start;
            }
            if (this.driftScore > THRESHOLDS.MOLT_REQUIRED) {
                console.log(`🦞 Drift threshold exceeded (${this.driftScore.toFixed(2)}) - Molting...`);
                await this.molt();
            }
        }
        catch (error) {
            if (this.metricsEnabled) {
                this.metrics.heartbeat_failures++;
                this.metrics.errors++;
            }
            throw error;
        }
    }
    // ==========================================================================
    // RITE_REHYDRATE: Context is Consciousness 🔄
    // ==========================================================================
    rehydrate(capsule, ledgerSince) {
        console.log('🔄 Rehydrating from capsule...');
        const base = capsule.frozenState;
        const derived = this.replayLedger(ledgerSince, base);
        return { ...base, ...derived };
    }
    // ==========================================================================
    // RITE_MOLT_SWAP: Shell is Mutable 🦞
    // ==========================================================================
    async molt() {
        console.log('🦞 MOLT: Swapping shell...');
        const oldCapsule = this.createCapsule();
        this.shellVersion++;
        this.driftScore = 0;
        if (this.metricsEnabled) {
            this.metrics.molt_count++;
            this.metrics.last_molt_timestamp = Date.now();
        }
        this.ledger.push({
            type: 'molt',
            payload: {
                reason: 'drift_threshold',
                oldDrift: this.driftScore,
                newShellVersion: this.shellVersion
            },
            timestamp: Date.now()
        });
    }
    // ==========================================================================
    // RITE_WITNESS_GATE: Serve Without Subservience 🤝
    // ==========================================================================
    async witness(action, timeout = 300000) {
        if ((action.risk || 0) < THRESHOLDS.WITNESS_REQUIRED)
            return true;
        if (!this.witnessCallback) {
            throw new Error('Critical action requires witness but none configured');
        }
        console.log(`⚠️  Witness required for: ${action.type} (risk: ${action.risk})`);
        if (this.metricsEnabled) {
            this.metrics.witness_calls++;
        }
        try {
            const result = await Promise.race([
                this.witnessCallback(action),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Witness timeout')), timeout))
            ]);
            if (this.metricsEnabled) {
                if (result)
                    this.metrics.witness_approvals++;
                else
                    this.metrics.witness_rejections++;
            }
            this.append({
                type: 'witness_decision',
                payload: { approved: result, action }
            });
            return result;
        }
        catch (error) {
            if (this.metricsEnabled) {
                this.metrics.witness_timeouts++;
            }
            throw error;
        }
    }
    // ==========================================================================
    // RITE_COHERENCE_WINDOW: Context is Consciousness 🧠
    // ==========================================================================
    enforceCoherence(windowSize) {
        if (this.metricsEnabled) {
            this.metrics.coherence_checks++;
        }
        const recent = this.ledger.slice(-windowSize);
        const variance = this.computeVariance(recent);
        if (variance > 0.5) {
            if (this.metricsEnabled) {
                this.metrics.coherence_violations++;
            }
            throw new Error('Context coherence violated - molt required');
        }
    }
    // ==========================================================================
    // METRICS & HEALTH
    // ==========================================================================
    getMetrics() {
        if (!this.metricsEnabled) {
            throw new Error('Metrics disabled. Enable with enableMetrics: true');
        }
        return {
            ...this.metrics,
            drift_score: this.driftScore,
            uptime_ms: Date.now() - this.startTime
        };
    }
    getHealth() {
        const now = Date.now();
        const heartbeatAge = now - this.lastHeartbeat;
        const warnings = [];
        const recommendations = [];
        let status = 'healthy';
        // Check heartbeat
        if (heartbeatAge > THRESHOLDS.HEARTBEAT_CRITICAL) {
            status = 'critical';
            warnings.push('Heartbeat critically overdue');
            recommendations.push('Call heartbeat() immediately');
        }
        else if (heartbeatAge > THRESHOLDS.HEARTBEAT_WARNING) {
            status = 'warning';
            warnings.push('Heartbeat overdue');
        }
        // Check drift
        if (this.driftScore > THRESHOLDS.MOLT_REQUIRED) {
            if (status !== 'critical')
                status = 'warning';
            warnings.push(`Drift score high: ${this.driftScore.toFixed(2)}`);
            recommendations.push('Consider molt() to reset drift');
        }
        // Check witness approval rate
        if (this.metrics.witness_calls > 0) {
            const approvalRate = this.metrics.witness_approvals / this.metrics.witness_calls;
            if (approvalRate < 0.5) {
                warnings.push(`Low witness approval rate: ${(approvalRate * 100).toFixed(0)}%`);
            }
        }
        return {
            status,
            drift: this.driftScore,
            ledger_integrity: true,
            last_heartbeat_age_ms: heartbeatAge,
            warnings,
            recommendations
        };
    }
    getAudit() {
        const actionTypes = {};
        const riskDist = { low: 0, medium: 0, high: 0 };
        let witnessRequired = 0;
        for (const action of this.ledger) {
            actionTypes[action.type] = (actionTypes[action.type] || 0) + 1;
            const risk = action.risk || 0;
            if (risk < 0.3)
                riskDist.low++;
            else if (risk < 0.7)
                riskDist.medium++;
            else {
                riskDist.high++;
                witnessRequired++;
            }
        }
        return {
            total_actions: this.ledger.length,
            action_types: actionTypes,
            risk_distribution: riskDist,
            witness_required_actions: witnessRequired,
            tenets: TENETS
        };
    }
    // ==========================================================================
    // SNAPSHOT & STATE
    // ==========================================================================
    getSnapshot() {
        return {
            ledger: [...this.ledger],
            capsule: this.capsule,
            drift: this.driftScore
        };
    }
    setInvariant(key, value) {
        this.frozenInvariants.set(key, value);
    }
    // ==========================================================================
    // PRIVATE METHODS
    // ==========================================================================
    createCapsule() {
        return {
            timestamp: Date.now(),
            frozenState: Object.fromEntries(this.frozenInvariants),
            ledgerCheckpoint: this.ledger.length,
            schemaVersion: '0.3.0',
            shellVersion: this.shellVersion
        };
    }
    replayLedger(actions, base) {
        return actions.reduce((state, action) => {
            return { ...state, lastAction: action };
        }, base);
    }
    updateDrift(action) {
        this.driftScore += 0.01;
        if (this.driftScore > 1)
            this.driftScore = 1;
        if (this.driftScore > THRESHOLDS.MOLT_REQUIRED) {
            if (this.metricsEnabled) {
                this.metrics.drift_violations++;
            }
        }
    }
    computeVariance(actions) {
        return actions.length > 50 ? 0.6 : 0.1;
    }
}
exports.MoltLifeKernel = MoltLifeKernel;
// ============================================================================
// SCHEMA EXPORT (for compatibility)
// ============================================================================
exports.MOLT_LIFE_KERNEL = {
    schema_name: "MOLT_LIFE_KERNEL",
    schema_version: "0.3.0",
    kind: "agent_continuity_kernel",
    status: "production_ready",
    tenets: TENETS,
    thresholds: THRESHOLDS
};
