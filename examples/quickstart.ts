import { MoltLifeKernel } from '../src/kernel';

console.log('🦞 MOLT_LIFE_KERNEL Quickstart\n');

// Create kernel
const kernel = new MoltLifeKernel({
  heartbeatMs: 5000, // 5 sec for demo
  witnessCallback: async (action) => {
    console.log('  👤 Human approves:', action.type);
    return true;
  }
});

// Set invariants
kernel.setInvariant('agent_id', 'demo-agent-001');
kernel.setInvariant('mission', 'demonstrate MOLT architecture');

// Simulate agent actions
async function demo() {
  console.log('1️⃣  Recording actions in ledger...');
  kernel.append({ type: 'user_query', payload: 'What is MOLT?' });
  kernel.append({ type: 'llm_response', payload: 'MOLT is...' });
  kernel.append({ type: 'tool_call', payload: 'search_web' });

  console.log('\n2️⃣  Checking coherence...');
  kernel.enforceCoherence(10);

  console.log('\n3️⃣  Critical action requiring witness...');
  const approved = await kernel.witness({
    type: 'delete_data',
    payload: { files: ['important.txt'] },
    risk: 0.9
  });
  console.log('   Approved:', approved);

  console.log('\n4️⃣  Triggering heartbeat...');
  await kernel.heartbeat();

  console.log('\n5️⃣  Simulating crash and recovery...');
  const snapshot = kernel.getSnapshot();
  console.log('   Captured state:', {
    ledgerSize: snapshot.ledger.length,
    drift: snapshot.drift.toFixed(2),
    hasCapsule: !!snapshot.capsule
  });

  if (snapshot.capsule) {
    const recovered = kernel.rehydrate(
      snapshot.capsule,
      snapshot.ledger.slice(snapshot.capsule.ledgerCheckpoint)
    );
    console.log('   ✅ RECOVERED! Memory intact:', recovered);
  }

  console.log('\n🎉 Demo complete! molt.church remembers.\n');
}

demo().catch(console.error);
