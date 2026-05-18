// Multi-Agent Orchestrator Simulation
// This demonstrates how three agents coordinate to implement a feature

interface Task {
  id: string;
  assignedTo: 'AgentA' | 'AgentB' | 'AgentC';
  description: string;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  output?: string;
  timestamp?: string;
}

interface AgentMessage {
  from: 'AgentA' | 'AgentB' | 'AgentC' | 'Orchestrator';
  to: 'AgentA' | 'AgentB' | 'AgentC' | 'All';
  message: string;
  timestamp: string;
}

// ============================================================================
// FEATURE: UEC Portal CLI Integration (Refactoring)
// ============================================================================

const featureTasks: Task[] = [
  // === Agent A: Backend Tasks ===
  {
    id: 'A1',
    assignedTo: 'AgentA',
    description: 'Review Prisma schema for UEC models (UecNotice, UecScheduleEntry, UecTimetableEntry)',
    dependencies: [],
    status: 'pending'
  },
  {
    id: 'A2',
    assignedTo: 'AgentA',
    description: 'Verify API routes: /api/hub/uec/* (status, login, logout, sync, notices, schedule, timetable)',
    dependencies: ['A1'],
    status: 'pending'
  },
  {
    id: 'A3',
    assignedTo: 'AgentA',
    description: 'Check lib/uec-portal/ for session management and scraping logic',
    dependencies: ['A2'],
    status: 'pending'
  },

  // === Agent B: Frontend Tasks ===
  {
    id: 'B1',
    assignedTo: 'AgentB',
    description: 'Review /hub/uec page component implementation',
    dependencies: [],
    status: 'pending'
  },
  {
    id: 'B2',
    assignedTo: 'AgentB',
    description: 'Verify UEC-specific UI components (tab navigation, accordion lists)',
    dependencies: ['B1'],
    status: 'pending'
  },
  {
    id: 'B3',
    assignedTo: 'AgentB',
    description: 'Check settings page for UEC Portal toggle integration',
    dependencies: ['B2'],
    status: 'pending'
  },

  // === Agent C: Testing Tasks ===
  {
    id: 'C1',
    assignedTo: 'AgentC',
    description: 'Create unit tests for UEC data models',
    dependencies: ['A1'],
    status: 'pending'
  },
  {
    id: 'C2',
    assignedTo: 'AgentC',
    description: 'Create integration tests for UEC API routes',
    dependencies: ['A2', 'C1'],
    status: 'pending'
  },
  {
    id: 'C3',
    assignedTo: 'AgentC',
    description: 'Create E2E tests for UEC Portal user flow',
    dependencies: ['B3', 'C2'],
    status: 'pending'
  },
  {
    id: 'C4',
    assignedTo: 'AgentC',
    description: 'Final validation and quality gate',
    dependencies: ['A3', 'B3', 'C3'],
    status: 'pending'
  }
];

// ============================================================================
// ORCHESTRATOR SIMULATION
// ============================================================================

class Orchestrator {
  private tasks: Task[] = [];
  private messages: AgentMessage[] = [];
  private agentStatus: { [key: string]: 'idle' | 'working' } = {
    AgentA: 'idle',
    AgentB: 'idle',
    AgentC: 'idle'
  };

  constructor(initialTasks: Task[]) {
    this.tasks = initialTasks;
  }

  log(message: string, from: string = 'Orchestrator') {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    console.log(`[${timestamp}] [${from}] ${message}`);
    this.messages.push({ from: from as any, to: 'All', message, timestamp });
  }

  canStartTask(task: Task): boolean {
    if (task.dependencies.length === 0) return true;

    const completedDeps = task.dependencies.every(depId => {
      const dep = this.tasks.find(t => t.id === depId);
      return dep?.status === 'completed';
    });

    return completedDeps;
  }

  getNextTask(agent: 'AgentA' | 'AgentB' | 'AgentC'): Task | null {
    const availableTasks = this.tasks.filter(task => {
      return task.assignedTo === agent &&
             task.status === 'pending' &&
             this.canStartTask(task);
    });

    return availableTasks[0] || null;
  }

  completeTask(taskId: string, output: string) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'completed';
      task.output = output;
      task.timestamp = new Date().toISOString().split('T')[1].slice(0, 8);

      // Check if this unblocks other tasks
      const unblocked = this.tasks.filter(t =>
        t.dependencies.includes(taskId) && t.status === 'blocked'
      );

      unblocked.forEach(t => {
        t.status = 'pending';
        this.log(`Task ${t.id} is now unblocked!`, 'Orchestrator');
      });

      // Mark dependent but not yet ready tasks as blocked
      const waiting = this.tasks.filter(t =>
        t.dependencies.includes(taskId) && t.status === 'pending'
      );

      waiting.forEach(t => {
        t.status = 'blocked';
      });
    }
  }

  async runSimulation() {
    this.log('=== MULTI-AGENT SIMULATION START ===', 'Orchestrator');
    this.log('Feature: UEC Portal CLI Integration Review', 'Orchestrator');
    this.log(`Total Tasks: ${this.tasks.length}`, 'Orchestrator');
    console.log('');

    const iterations: Array<Promise<void>> = [];

    // Run agents in parallel
    iterations.push(this.runAgentA());
    iterations.push(this.runAgentB());
    iterations.push(this.runAgentC());

    await Promise.all(iterations);

    console.log('');
    this.log('=== MULTI-AGENT SIMULATION COMPLETE ===', 'Orchestrator');
    this.printSummary();
  }

  async runAgentA() {
    this.log('Agent A (Backend) starting...', 'AgentA');

    while (true) {
      const task = this.getNextTask('AgentA');
      if (!task) {
        // Check if all Agent A tasks are done
        const allDone = this.tasks.filter(t => t.assignedTo === 'AgentA').every(t => t.status === 'completed');
        if (allDone) break;
        // Wait a bit and retry
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      this.agentStatus.AgentA = 'working';
      task.status = 'in_progress';
      this.log(`Starting: ${task.description}`, 'AgentA');

      // Simulate work
      await this.simulateWork('AgentA', task.description);

      const output = this.agentAOutput(task.id);
      this.completeTask(task.id, output);
      this.log(`Completed: ${task.id} - ${output}`, 'AgentA');
    }

    this.agentStatus.AgentA = 'idle';
    this.log('Agent A (Backend) finished all tasks', 'AgentA');
  }

  async runAgentB() {
    this.log('Agent B (Frontend) starting...', 'AgentB');

    while (true) {
      const task = this.getNextTask('AgentB');
      if (!task) {
        const allDone = this.tasks.filter(t => t.assignedTo === 'AgentB').every(t => t.status === 'completed');
        if (allDone) break;
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      this.agentStatus.AgentB = 'working';
      task.status = 'in_progress';
      this.log(`Starting: ${task.description}`, 'AgentB');

      // Simulate work
      await this.simulateWork('AgentB', task.description);

      const output = this.agentBOutput(task.id);
      this.completeTask(task.id, output);
      this.log(`Completed: ${task.id} - ${output}`, 'AgentB');
    }

    this.agentStatus.AgentB = 'idle';
    this.log('Agent B (Frontend) finished all tasks', 'AgentB');
  }

  async runAgentC() {
    this.log('Agent C (Testing) starting...', 'AgentC');

    while (true) {
      const task = this.getNextTask('AgentC');
      if (!task) break;

      // Check dependencies - if not ready, wait and retry
      if (!this.canStartTask(task)) {
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }

      this.agentStatus.AgentC = 'working';
      task.status = 'in_progress';
      this.log(`Starting: ${task.description}`, 'AgentC');

      // Simulate work
      await this.simulateWork('AgentC', task.description);

      const output = this.agentCOutput(task.id);
      this.completeTask(task.id, output);
      this.log(`Completed: ${task.id} - ${output}`, 'AgentC');
    }

    this.agentStatus.AgentC = 'idle';
    this.log('Agent C (Testing) finished all tasks', 'AgentC');
  }

  private async simulateWork(agent: string, description: string) {
    const duration = Math.random() * 500 + 300;
    await new Promise(resolve => setTimeout(resolve, duration));
  }

  private agentAOutput(taskId: string): string {
    const outputs: { [key: string]: string } = {
      'A1': 'Verified 3 UEC models with correct relations',
      'A2': 'Confirmed 7 API routes operational',
      'A3': 'Validated session.ts and scraper.ts logic'
    };
    return outputs[taskId] || 'Backend task completed';
  }

  private agentBOutput(taskId: string): string {
    const outputs: { [key: string]: string } = {
      'B1': 'UEC page component reviewed - 3 tabs implemented',
      'B2': 'Tab navigation and accordion lists verified',
      'B3': 'Settings toggle integration confirmed'
    };
    return outputs[taskId] || 'Frontend task completed';
  }

  private agentCOutput(taskId: string): string {
    const outputs: { [key: string]: string } = {
      'C1': 'Created 5 unit tests for UEC models',
      'C2': 'Created 3 integration tests for API routes',
      'C3': 'Created 2 E2E tests for user flow',
      'C4': 'All tests passing - Quality gate passed ✅'
    };
    return outputs[taskId] || 'Testing task completed';
  }

  printSummary() {
    console.log('\n=== TASK SUMMARY ===');
    this.tasks.forEach(task => {
      const status = task.status === 'completed' ? '✅' : '⏳';
      console.log(`${status} [${task.id}] ${task.assignedTo}: ${task.description}`);
      if (task.output) {
        console.log(`      → ${task.output}`);
      }
    });

    console.log('\n=== AGENT PERFORMANCE ===');
    const agentATasks = this.tasks.filter(t => t.assignedTo === 'AgentA').length;
    const agentBTasks = this.tasks.filter(t => t.assignedTo === 'AgentB').length;
    const agentCTasks = this.tasks.filter(t => t.assignedTo === 'AgentC').length;
    console.log(`Agent A (Backend): ${agentATasks} tasks`);
    console.log(`Agent B (Frontend): ${agentBTasks} tasks`);
    console.log(`Agent C (Testing): ${agentCTasks} tasks`);
  }
}

// Run the simulation
const orchestrator = new Orchestrator(featureTasks);
orchestrator.runSimulation();
