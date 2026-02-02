/**
 * MOLT_LIFE_KERNEL v0.2.0 - PRODUCTION IMPLEMENTATION
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
}
export interface KernelConfig {
    heartbeatMs?: number;
    witnessCallback?: (action: Action) => Promise<boolean>;
    driftThreshold?: number;
}
export declare class MoltLifeKernel {
    private ledger;
    private capsule;
    private lastHeartbeat;
    private heartbeatInterval;
    private driftScore;
    private witnessCallback?;
    private frozenInvariants;
    constructor(config?: KernelConfig);
    append(action: Action): void;
    heartbeat(): Promise<void>;
    rehydrate(capsule: StateCapsule, ledgerSince: Action[]): any;
    molt(): Promise<void>;
    witness(action: Action): Promise<boolean>;
    enforceCoherence(windowSize: number): void;
    getSnapshot(): {
        ledger: Action[];
        capsule: StateCapsule | null;
        drift: number;
    };
    private createCapsule;
    private replayLedger;
    private updateDrift;
    private computeVariance;
    setInvariant(key: string, value: any): void;
}
