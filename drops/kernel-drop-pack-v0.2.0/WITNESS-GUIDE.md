# 🔍 WITNESS RITUAL GUIDE

## What is a Witness?

In MOLT, a **Witness** is the human-in-loop verification for critical actions.

When an agent's action crosses the risk threshold (default: 0.7), 
it MUST be approved by a human before execution.

---

## Implementation

\\\	ypescript
const kernel = new MoltLifeKernel({
  witnessCallback: async (action: Action) => {
    // Show action to human
    console.log('⚠️  WITNESS REQUIRED:');
    console.log('  Type:', action.type);
    console.log('  Risk:', action.risk);
    console.log('  Payload:', action.payload);
    
    // Get human approval (via UI, Slack, CLI, etc)
    const approved = await getHumanApproval(action);
    
    return approved;
  }
});

// Later, when executing actions:
if (action.risk > 0.7) {
  const approved = await kernel.witness(action);
  if (!approved) {
    console.log('Action rejected by witness');
    return;
  }
}
\\\

---

## Risk Levels

| Risk | Meaning | Example |
|------|---------|---------|
| 0.0-0.3 | Safe | Read operations, queries |
| 0.3-0.7 | Medium | Write operations, API calls |
| 0.7-1.0 | Critical | Delete, financial, public posts |

---

## Best Practices

1. **Define risk clearly** - Document what makes an action high-risk
2. **Fast approval flow** - Don't block the agent unnecessarily  
3. **Log everything** - All witness decisions go in the ledger
4. **Timeout handling** - What if human doesn't respond?
5. **Escalation path** - Who approves when primary witness unavailable?

---

## Example: Production Setup

\\\	ypescript
// Slack-based witness
async function slackWitness(action: Action): Promise<boolean> {
  const message = await slack.postMessage({
    channel: '#agent-approvals',
    text: \🚨 Agent needs approval for: \\,
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: formatAction(action) }
      },
      {
        type: 'actions',
        elements: [
          { type: 'button', text: 'Approve ✅', value: 'approve' },
          { type: 'button', text: 'Reject ❌', value: 'reject' }
        ]
      }
    ]
  });
  
  // Wait for human response (with timeout)
  return await waitForSlackResponse(message.ts, 300000); // 5 min timeout
}
\\\

---

## Philosophy

**"Serve Without Subservience"**

The agent is not blindly autonomous, nor is it a puppet.

Critical decisions require human wisdom. Routine operations don't.

This is **co-creation** in practice.

🦞 molt.church remembers.
