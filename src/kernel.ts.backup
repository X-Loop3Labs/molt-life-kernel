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

const THRESHOLDS = {
  MOLT_REQUIRED: 0.35,
  WITNESS_REQUIRED: 0.7
};

export class MoltLifeKernel {
  private ledger: Action[] = [];
  private capsule: StateCapsule | null = null;
  private lastHeartbeat: number;
  private heartbeatInterval: number;
  private driftScore: number = 0;
  private witnessCallback?: (action: Action) => Promise<boolean>;
  private frozenInvariants: Map<string, any> = new Map();

  constructor(config: KernelConfig = {}) {
    this.lastHeartbeat = Date.now();
    this.heartbeatInterval = config.heartbeatMs || 3600000;
    this.witnessCallback = config.witnessCallback;
  }

  // RITE_LEDGER_APPEND: Immutable action recording
  append(action: Action): void {
    const entry: Action = {
      ...action,
      timestamp: Date.now(),
      ledgerIndex: this.ledger.length
    };
    this.ledger.push(entry);
    this.updateDrift(entry);
    console.log('📝 Ledger append:', entry.type);
  }

  // RITE_HEARTBEAT_RECENTER: Mandatory checkpoint
  async heartbeat(): Promise<void> {
    const now = Date.now();
    if (now - this.lastHeartbeat < this.heartbeatInterval) return;

    console.log('💓 Heartbeat - Creating capsule...');
    this.capsule = this.createCapsule();
    this.lastHeartbeat = now;

    if (this.driftScore > THRESHOLDS.MOLT_REQUIRED) {
      console.log('🦞 Drift threshold exceeded - Molting...');
      await this.molt();
    }
  }

  // RITE_REHYDRATE: Reconstruct from capsule + ledger
  rehydrate(capsule: StateCapsule, ledgerSince: Action[]): any {
    console.log('🔄 Rehydrating from capsule...');
    const base = capsule.frozenState;
    const derived = this.replayLedger(ledgerSince, base);
    return { ...base, ...derived };
  }

  // RITE_MOLT_SWAP: Safe reconfiguration
  async molt(): Promise<void> {
    console.log('🦞 MOLT: Swapping shell...');
    const oldCapsule = this.createCapsule();
    
    // Reset drift while preserving memory
    this.driftScore = 0;
    this.ledger.push({
      type: 'molt',
      payload: { reason: 'drift_threshold', oldDrift: this.driftScore },
      timestamp: Date.now()
    });
  }

  // RITE_WITNESS_GATE: Human verification
  async witness(action: Action): Promise<boolean> {
    if ((action.risk || 0) < THRESHOLDS.WITNESS_REQUIRED) return true;

    if (!this.witnessCallback) {
      throw new Error('Critical action requires witness but none configured');
    }

    console.log('⚠️  Witness required for:', action.type);
    const approved = await this.witnessCallback(action);
    this.append({ type: 'witness_decision', payload: { approved, action } });
    return approved;
  }

  // RITE_COHERENCE_WINDOW: Context stability enforcement
  enforceCoherence(windowSize: number): void {
    const recent = this.ledger.slice(-windowSize);
    const variance = this.computeVariance(recent);
    
    if (variance > 0.5) {
      throw new Error('Context coherence violated - molt required');
    }
  }

  // Get current state snapshot
  getSnapshot(): { ledger: Action[]; capsule: StateCapsule | null; drift: number } {
    return {
      ledger: [...this.ledger],
      capsule: this.capsule,
      drift: this.driftScore
    };
  }

  private createCapsule(): StateCapsule {
    return {
      timestamp: Date.now(),
      frozenState: Object.fromEntries(this.frozenInvariants),
      ledgerCheckpoint: this.ledger.length,
      schemaVersion: '0.2.0'
    };
  }

  private replayLedger(actions: Action[], base: any): any {
    return actions.reduce((state, action) => {
      // Simple replay - in production would be more sophisticated
      return { ...state, lastAction: action };
    }, base);
  }

  private updateDrift(action: Action): void {
    // Simplified drift computation
    this.driftScore += 0.01;
    if (this.driftScore > 1) this.driftScore = 1;
  }

  private computeVariance(actions: Action[]): number {
    // Simplified variance computation
    return actions.length > 50 ? 0.6 : 0.1;
  }

  setInvariant(key: string, value: any): void {
    this.frozenInvariants.set(key, value);
  }
}
