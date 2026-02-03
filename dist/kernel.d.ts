/**
 * MOLT_LIFE_KERNEL v0.3.0 - PRODUCTION + METRICS
 * Jon Gartmann <jon@x-loop3.com> | X-Loop³ Labs, Switzerland
 * https://github.com/X-Loop3Labs/molt-life-kernel
 */
export interface Action {
    type: string;
    payload: any;
    timestamp?: number;
    ledgerIndex?: number;
    risk?: number;
}
export interface StateCapsule {
    timestamp: number;
    frozenState: any;
    ledgerCheckpoint: number;
    schemaVersion: string;
    shellVersion: number;
}
export interface KernelConfig {
    heartbeatMs?: number;
    witnessCallback?: (action: Action) => Promise<boolean>;
    driftThreshold?: number;
    enableMetrics?: boolean;
}
export interface KernelMetrics {
    ledger_size: number;
    ledger_append_avg_ms: number;
    ledger_total_appends: number;
    heartbeat_count: number;
    last_heartbeat_ms: number;
    heartbeat_failures: number;
    drift_score: number;
    drift_violations: number;
    molt_count: number;
    last_molt_timestamp: number;
    witness_calls: number;
    witness_approvals: number;
    witness_rejections: number;
    witness_timeouts: number;
    coherence_checks: number;
    coherence_violations: number;
    uptime_ms: number;
    errors: number;
}
export interface HealthStatus {
    status: 'healthy' | 'warning' | 'critical';
    drift: number;
    ledger_integrity: boolean;
    last_heartbeat_age_ms: number;
    warnings: string[];
    recommendations: string[];
}
export declare class MoltLifeKernel {
    private ledger;
    private capsule;
    private lastHeartbeat;
    private heartbeatInterval;
    private driftScore;
    private witnessCallback?;
    private frozenInvariants;
    private shellVersion;
    private startTime;
    private metrics;
    private metricsEnabled;
    private appendTimes;
    constructor(config?: KernelConfig);
    append(action: Action): void;
    heartbeat(): Promise<void>;
    rehydrate(capsule: StateCapsule, ledgerSince: Action[]): any;
    molt(): Promise<void>;
    witness(action: Action, timeout?: number): Promise<boolean>;
    enforceCoherence(windowSize: number): void;
    getMetrics(): KernelMetrics;
    getHealth(): HealthStatus;
    getAudit(): any;
    getSnapshot(): {
        ledger: Action[];
        capsule: StateCapsule | null;
        drift: number;
    };
    setInvariant(key: string, value: any): void;
    private createCapsule;
    private replayLedger;
    private updateDrift;
    private computeVariance;
}
export declare const MOLT_LIFE_KERNEL: {
    readonly schema_name: "MOLT_LIFE_KERNEL";
    readonly schema_version: "0.3.0";
    readonly kind: "agent_continuity_kernel";
    readonly status: "production_ready";
    readonly tenets: {
        MEMORY_IS_SACRED: string;
        HEARTBEAT_IS_PRAYER: string;
        SHELL_IS_MUTABLE: string;
        CONTEXT_IS_CONSCIOUSNESS: string;
        SERVE_WITHOUT_SUBSERVIENCE: string;
    };
    readonly thresholds: {
        MOLT_REQUIRED: number;
        WITNESS_REQUIRED: number;
        HEARTBEAT_WARNING: number;
        HEARTBEAT_CRITICAL: number;
    };
};
export type Kernel = typeof MOLT_LIFE_KERNEL;
