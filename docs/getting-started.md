# Getting Started with O.R.B.I.T.

This guide will help you get started with the O.R.B.I.T. framework.

## Prerequisites

- Node.js v18 or higher
- yarn v4.0.2 or higher
- Basic understanding of TypeScript
- Basic understanding of blockchain concepts

## Installation

1. Clone the repository:

```bash
git clone https://github.com/metros-org/orbit-framework.git
cd orbit-framework
```

2. Install dependencies:

```bash
yarn install
```

3. Build the packages:

```bash
yarn build
```

## Using in Your Project

1. Create a new TypeScript project:

```bash
mkdir my-orbit-project
cd my-orbit-project
yarn init -y
yarn add typescript @types/node --dev
yarn tsc --init
```

2. Add the orbit-framework as a git dependency in your package.json:

```json
{
  "dependencies": {
    "@orbit/core": "git+https://github.com/metros-org/orbit-framework.git#main",
    "@orbit/tools": "git+https://github.com/metros-org/orbit-framework.git#main"
  }
}
```

3. Install optional packages based on your needs:

```json
{
  "dependencies": {
    "@orbit/blockchain": "git+https://github.com/metros-org/orbit-framework.git#main",
    "@orbit/context": "git+https://github.com/metros-org/orbit-framework.git#main",
    "@orbit/security": "git+https://github.com/metros-org/orbit-framework.git#main"
  }
}
```

## Basic Setup

1. Create a new TypeScript project:

```bash
mkdir my-orbit-project
cd my-orbit-project
npm init -y
npm install typescript @types/node --save-dev
npx tsc --init
```

2. Create your first orchestrator:

```typescript
// src/index.ts
import { Orchestrator, BedrockAgent } from '@orbit/core';
import { Web3Tool } from '@orbit/tools';

async function main() {
    // Initialize the orchestrator
    const orchestrator = new Orchestrator({
        agents: [
            new BedrockAgent({
                name: 'data-analyzer',
                modelId: 'anthropic.claude-v2'
            })
        ],
        tools: [new Web3Tool()]
    });

    // Initialize the system
    await orchestrator.initialize();

    // Submit a task
    const result = await orchestrator.submitTask({
        id: 'analyze-data-1',
        type: 'analysis',
        input: {
            data: 'Your data here',
            parameters: {
                // Your parameters
            }
        }
    });

    console.log('Task result:', result);
}

main().catch(console.error);
```

## Configuration

### Core Configuration

```typescript
import { OrchestratorConfig } from '@orbit/core';

const config: OrchestratorConfig = {
    maxConcurrentTasks: 5,
    defaultTimeout: 30000, // 30 seconds
    retryStrategy: {
        maxAttempts: 3,
        backoff: 'exponential',
        initialDelay: 1000
    }
};
```

### Blockchain Integration

```typescript
import { EthereumProvider } from '@orbit/blockchain';

const provider = new EthereumProvider({
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'YOUR_RPC_URL',
    nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18
    }
});
```

### Context Management

```typescript
import { DefaultContextProvider } from '@orbit/context';

const contextProvider = new DefaultContextProvider({
    redis: {
        host: 'localhost',
        port: 6379
    },
    ttl: 3600 // 1 hour
});
```

### Security Setup

```typescript
import { DefaultSecurityProvider } from '@orbit/security';

const securityProvider = new DefaultSecurityProvider({
    encryptionAlgorithm: 'ECDH-ES+A256KW',
    signatureAlgorithm: 'EdDSA'
});
```

## Next Steps

- Read the [Core Concepts](core-concepts.md) guide to understand the framework's architecture
- Check out the [Examples](../examples) directory for more advanced use cases
- Review the [API Reference](api-reference.md) for detailed documentation

## Common Patterns

### Task Orchestration

```typescript
// Define task dependencies
const task = {
    id: 'complex-task',
    type: 'workflow',
    input: {
        data: 'input data'
    },
    dependencies: ['task-1', 'task-2']
};

// Submit task with context
const result = await orchestrator.submitTask({
    ...task,
    context: {
        variables: {
            key: 'value'
        },
        memory: {
            shortTerm: {},
            longTerm: {},
            episodic: []
        }
    }
});
```

### Agent Communication

```typescript
// Set up agent communication
agent1.on('message', (message) => {
    console.log('Agent 1 received:', message);
});

agent2.on('message', (message) => {
    console.log('Agent 2 received:', message);
});

// Send messages between agents
await agent1.send(agent2.name, {
    type: 'request',
    content: 'Hello from Agent 1'
});
```

### Error Handling

```typescript
try {
    const result = await orchestrator.submitTask(task);
} catch (error) {
    if (error.code === 'TASK_TIMEOUT') {
        // Handle timeout
    } else if (error.code === 'AGENT_ERROR') {
        // Handle agent error
    } else {
        // Handle other errors
    }
}
```

## Best Practices

1. **Task Granularity**: Keep tasks focused and atomic
2. **Error Handling**: Implement comprehensive error handling
3. **Resource Management**: Monitor and manage system resources
4. **Security**: Always use secure communication channels
5. **Monitoring**: Implement logging and monitoring
6. **Testing**: Write unit tests for critical components

## Troubleshooting

Common issues and their solutions:

1. **Connection Issues**
   - Check network connectivity
   - Verify RPC endpoints
   - Check Redis connection (if using)

2. **Performance Issues**
   - Monitor task queue size
   - Check agent load
   - Verify system resources

3. **Memory Issues**
   - Monitor memory usage
   - Clear context cache regularly
   - Implement garbage collection

For more help, check the [examples](../examples) or open an issue on GitHub. 