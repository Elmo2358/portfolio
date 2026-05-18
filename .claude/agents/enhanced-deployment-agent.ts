// Enhanced Self-Healing Deployment & Monitoring System
// Extends original deployment agent with advanced monitoring and healing capabilities

interface DeploymentConfig {
  environment: 'test' | 'staging' | 'production';
  terraformDir: string;
  skipTests?: boolean;
  stagingMonitorDuration?: number; // minutes (default: 30)
  productionMonitorDuration?: number; // minutes (default: 120)
  gradualRollout?: boolean; // Enable gradual rollout
  rolloutPercentage?: number; // Start with X% of traffic
  errorThreshold?: number; // Error rate threshold for auto-rollback (default: 5%)
}

interface MonitoringMetrics {
  timestamp: string;
  errorRate: number; // percentage
  avgResponseTime: number; // milliseconds
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  activeConnections: number;
}

interface DeploymentKnowledgeBase {
  failurePatterns: Map<string, number>; // error pattern -> occurrence count
  successfulPatterns: Map<string, number>;
  remediationHistory: Map<string, boolean>; // remediation -> success rate
}

interface RemediationAction {
  type: 'retry' | 'fix_common_issue' | 'rollback' | 'escalate';
  description: string;
  attemptNumber: number;
}

enum DeploymentState {
  VALIDATING = '🔍 VALIDATING',
  TEST_DEPLOY = '🧪 TEST_DEPLOY',
  STAGING_DEPLOY = '🚀 STAGING_DEPLOY',
  STAGING_MONITORING = '📊 STAGING_MONITORING',
  GRADUAL_ROLLOUT = '📈 GRADUAL_ROLLOUT',
  PRODUCTION_DEPLOY = '🚀 PRODUCTION_DEPLOY',
  PRODUCTION_MONITORING = '📊 PRODUCTION_MONITORING',
  HEALING = '🔧 HEALING',
  SUCCESS = '✅ SUCCESS',
  FAILED = '❌ FAILED',
  ROLLING_BACK = '⏪ ROLLING_BACK'
}

// ============================================================================
// ENHANCED DEPLOYMENT AGENT WITH SELF-HEALING
// ============================================================================

class EnhancedDeploymentAgent {
  private state: DeploymentState = DeploymentState.VALIDATING;
  private logs: string[] = [];
  private metrics: MonitoringMetrics[] = [];
  private knowledgeBase: DeploymentKnowledgeBase = {
    failurePatterns: new Map(),
    successfulPatterns: new Map(),
    remediationHistory: new Map()
  };
  private maxRemediationAttempts = 3;

  // Baseline metrics established during staging
  private baselineMetrics: MonitoringMetrics | null = null;

  // ============================================================================
  // EXTENDED MONITORING WITH DETAILED METRICS
  // ============================================================================

  async monitorWithDetailedMetrics(
    env: 'staging' | 'production',
    durationMinutes: number,
    errorThreshold: number
  ): Promise<{ healthy: boolean; reason?: string }> {
    const stateKey = env === 'staging' ? DeploymentState.STAGING_MONITORING : DeploymentState.PRODUCTION_MONITORING;
    this.setState(stateKey);

    const intervals = durationMinutes * 2; // Check every 30 seconds

    this.log(`📊 Monitoring ${env.toUpperCase()} for ${durationMinutes} minutes (${intervals} intervals)`);
    this.log(`   Error threshold: ${errorThreshold}%`);

    for (let i = 0; i < intervals; i++) {
      await this.sleep(150); // Simulated time (faster for demo)

      const currentMetrics = await this.collectMetrics();

      // Store metrics
      this.metrics.push({ ...currentMetrics, timestamp: new Date().toISOString() });

      // Set baseline if this is the first staging check
      if (env === 'staging' && i === 0) {
        this.baselineMetrics = currentMetrics;
        this.log(`   📈 Baseline established: ${currentMetrics.avgResponseTime}ms avg response time`);
      }

      // Check for issues
      const healthCheck = this.checkHealth(currentMetrics, errorThreshold);

      if (!healthCheck.healthy) {
        this.log(`   ❌ Health check failed: ${healthCheck.reason}`);

        // Try self-healing before giving up
        if (await this.attemptHealing(healthCheck.reason!, env)) {
          this.log(`   ✅ Self-healing successful, continuing monitoring...`);
          continue;
        }

        return { healthy: false, reason: healthCheck.reason };
      }

      // Progressive logging
      if (i === 0 || i === intervals - 1 || i % 4 === 0) {
        this.log(`   ✅ Check ${i + 1}/${intervals}: OK (errors: ${currentMetrics.errorRate}%, perf: ${currentMetrics.avgResponseTime}ms)`);
      }

      // For gradual rollout, increase traffic percentage
      if (env === 'production' && this.shouldIncreaseTraffic(i, intervals)) {
        const newPercentage = this.calculateRolloutPercentage(i, intervals);
        this.log(`   📈 Increasing rollout to ${newPercentage}% of traffic`);
      }
    }

    this.log(`✅ ${env.toUpperCase()} monitoring PASSED`);
    return { healthy: true };
  }

  private async collectMetrics(): Promise<MonitoringMetrics> {
    // Simulate collecting detailed metrics
    const baseErrorRate = this.shouldDemoError() ? Math.random() * 10 : Math.random() * 2;
    const baseResponseTime = 50 + Math.random() * 100;

    return {
      timestamp: new Date().toISOString(),
      errorRate: Number(baseErrorRate.toFixed(2)),
      avgResponseTime: Math.floor(baseResponseTime),
      p95ResponseTime: Math.floor(baseResponseTime * 1.5),
      p99ResponseTime: Math.floor(baseResponseTime * 2),
      requestsPerSecond: Math.floor(100 + Math.random() * 500),
      cpuUsage: Math.floor(20 + Math.random() * 60),
      memoryUsage: Math.floor(30 + Math.random() * 50),
      activeConnections: Math.floor(50 + Math.random() * 200)
    };
  }

  private checkHealth(metrics: MonitoringMetrics, errorThreshold: number): { healthy: boolean; reason?: string } {
    // Check error rate
    if (metrics.errorRate > errorThreshold) {
      return {
        healthy: false,
        reason: `Error rate (${metrics.errorRate}%) exceeds threshold (${errorThreshold}%)`
      };
    }

    // Check response time degradation (2x baseline)
    if (this.baselineMetrics && metrics.avgResponseTime > this.baselineMetrics.avgResponseTime * 2) {
      return {
        healthy: false,
        reason: `Response time (${metrics.avgResponseTime}ms) is 2x+ baseline (${this.baselineMetrics.avgResponseTime}ms)`
      };
    }

    // Check P99 latency
    if (metrics.p99ResponseTime > 2000) {
      return {
        healthy: false,
        reason: `P99 latency (${metrics.p99ResponseTime}ms) exceeds 2000ms threshold`
      };
    }

    // Check resource exhaustion
    if (metrics.cpuUsage > 90) {
      return {
        healthy: false,
        reason: `CPU usage (${metrics.cpuUsage}%) near exhaustion`
      };
    }

    if (metrics.memoryUsage > 90) {
      return {
        healthy: false,
        reason: `Memory usage (${metrics.memoryUsage}%) near exhaustion`
      };
    }

    return { healthy: true };
  }

  // ============================================================================
  // SELF-HEALING CAPABILITIES
  // ============================================================================

  private async attemptHealing(issue: string, env: string): Promise<boolean> {
    this.setState(DeploymentState.HEALING);
    this.log(`🔧 Attempting self-healing for: ${issue}`);

    // Check knowledge base for similar past issues
    const similarIssue = this.findSimilarIssue(issue);

    for (let attempt = 1; attempt <= this.maxRemediationAttempts; attempt++) {
      const action = this.determineRemediationAction(issue, attempt, similarIssue);

      this.log(`   🔄 Attempt ${attempt}/${this.maxRemediationAttempts}: ${action.description}`);

      await this.sleep(200);

      // Simulate remediation
      const success = await this.executeRemediation(action);

      if (success) {
        // Record successful remediation
        this.recordRemediation(action, true);
        this.log(`   ✅ Remediation successful`);
        return true;
      }

      this.recordRemediation(action, false);
    }

    this.log(`   ❌ Self-healing failed after ${this.maxRemediationAttempts} attempts`);
    return false;
  }

  private determineRemediationAction(
    issue: string,
    attempt: number,
    similarIssue?: { action: string; successRate: number }
  ): RemediationAction {
    // If we have a similar past issue with high success rate, try that
    if (similarIssue && similarIssue.successRate > 0.7 && attempt === 1) {
      return {
        type: 'fix_common_issue',
        description: `Apply known fix: ${similarIssue.action}`,
        attemptNumber: attempt
      };
    }

    // First attempt: retry
    if (attempt === 1) {
      return {
        type: 'retry',
        description: 'Retry failed operation',
        attemptNumber: attempt
      };
    }

    // Second attempt: try common fixes based on issue type
    if (attempt === 2) {
      if (issue.includes('cache')) {
        return {
          type: 'fix_common_issue',
          description: 'Clear application cache',
          attemptNumber: attempt
        };
      } else if (issue.includes('memory') || issue.includes('CPU')) {
        return {
          type: 'fix_common_issue',
          description: 'Restart affected services',
          attemptNumber: attempt
        };
      } else if (issue.includes('latency') || issue.includes('response time')) {
        return {
          type: 'fix_common_issue',
          description: 'Scale up resources',
          attemptNumber: attempt
        };
      } else {
        return {
          type: 'fix_common_issue',
          description: 'Restart deployment with warm restart',
          attemptNumber: attempt
        };
      }
    }

    // Third attempt: escalate
    return {
      type: 'escalate',
      description: 'Escalate for human intervention',
      attemptNumber: attempt
    };
  }

  private async executeRemediation(action: RemediationAction): Promise<boolean> {
    // Simulate executing remediation action
    if (action.type === 'retry') {
      // Simple retry has 60% success rate
      return Math.random() > 0.4;
    } else if (action.type === 'fix_common_issue') {
      // Known fixes have higher success rate
      return Math.random() > 0.3;
    } else if (action.type === 'escalate') {
      // Escalation means we give up
      return false;
    }
    return false;
  }

  private findSimilarIssue(issue: string): { action: string; successRate: number } | undefined {
    // Simple keyword matching for similar issues
    const lowerIssue = issue.toLowerCase();

    for (const [pattern, remediation] of this.knowledgeBase.remediationHistory) {
      if (lowerIssue.includes(pattern.toLowerCase())) {
        // Calculate success rate from history
        const successRate = this.knowledgeBase.failurePatterns.get(pattern) || 0.5;
        return { action: remediation, successRate };
      }
    }

    return undefined;
  }

  private recordRemediation(action: RemediationAction, success: boolean): void {
    // Record successful remediations for future reference
    if (success && action.type === 'fix_common_issue') {
      const key = action.description.split(': ')[1] || action.description;
      this.knowledgeBase.remediationHistory.set(key, action.description);
    }
  }

  // ============================================================================
  // GRADUAL ROLLOUT
  // ============================================================================

  private shouldIncreaseTraffic(currentInterval: number, totalIntervals: number): boolean {
    // Increase traffic at 25%, 50%, 75%, 100% of monitoring period
    const percentages = [0.25, 0.5, 0.75, 1.0];
    const progress = currentInterval / totalIntervals;

    return percentages.some(p => Math.abs(progress - p) < 0.05);
  }

  private calculateRolloutPercentage(currentInterval: number, totalIntervals: number): number {
    const progress = currentInterval / totalIntervals;

    if (progress < 0.25) return 10;
    if (progress < 0.5) return 25;
    if (progress < 0.75) return 50;
    return 100;
  }

  // ============================================================================
  // MAIN DEPLOYMENT ORCHESTRATION
  // ============================================================================

  async deploy(config: DeploymentConfig): Promise<{
    success: boolean;
    summary: string;
    metricsCollected: number;
    healingAttempts: number;
  }> {
    this.log('\n' + '='.repeat(70));
    this.log('🚀 SELF-HEALING DEPLOYMENT PIPELINE STARTING');
    this.log('='.repeat(70));
    this.log(`Environment: ${config.environment}`);
    this.log(`Gradual Rollout: ${config.gradualRollout ? 'Enabled' : 'Disabled'}`);
    this.log(`Staging Monitor: ${config.stagingMonitorDuration || 30} min`);
    this.log(`Production Monitor: ${config.productionMonitorDuration || 120} min`);
    this.log(`Error Threshold: ${config.errorThreshold || 5}%`);
    this.log('');

    let healingAttempts = 0;

    try {
      // Phase 1: Validation (simplified for demo)
      this.setState(DeploymentState.VALIDATING);
      this.log('🔍 Validating configuration...');
      await this.sleep(300);
      this.log('✅ Validation passed');

      // Phase 2: Test deployment
      if (!config.skipTests) {
        this.setState(DeploymentState.TEST_DEPLOY);
        this.log('🧪 Deploying to test environment...');
        await this.sleep(400);
        this.log('✅ Test deployment passed');
      }

      // Phase 3: Staging deployment with monitoring
      this.setState(DeploymentState.STAGING_DEPLOY);
      this.log('🚀 Deploying to STAGING environment...');
      await this.sleep(500);
      this.log('✅ Staging deployment complete');

      // Phase 4: Staging monitoring (30 minutes default)
      const stagingDuration = config.stagingMonitorDuration || 30;
      this.log(`📊 Monitoring staging for ${stagingDuration} minutes...`);

      const stagingResult = await this.monitorWithDetailedMetrics(
        'staging',
        stagingDuration,
        config.errorThreshold || 5
      );

      if (!stagingResult.healthy) {
        this.log(`❌ Staging monitoring failed: ${stagingResult.reason}`);
        await this.rollback('staging', stagingResult.reason!);
        return {
          success: false,
          summary: `Staging monitoring failed: ${stagingResult.reason}`,
          metricsCollected: this.metrics.length,
          healingAttempts
        };
      }

      // Phase 5: Gradual rollout to production
      if (config.gradualRollout) {
        this.setState(DeploymentState.GRADUAL_ROLLOUT);
        this.log('📈 Starting gradual rollout to production...');
        this.log('   Initial: 10% of traffic');
        await this.sleep(200);
      }

      // Phase 6: Production deployment
      this.setState(DeploymentState.PRODUCTION_DEPLOY);
      this.log('🚀 Deploying to PRODUCTION environment...');
      await this.sleep(500);
      this.log('✅ Production deployment complete');

      // Phase 7: Production monitoring (2 hours default)
      const prodDuration = config.productionMonitorDuration || 120;
      this.log(`📊 Monitoring production for ${prodDuration} minutes...`);

      const prodResult = await this.monitorWithDetailedMetrics(
        'production',
        prodDuration,
        config.errorThreshold || 5
      );

      if (!prodResult.healthy) {
        this.log(`❌ Production monitoring failed: ${prodResult.reason}`);
        await this.rollback('production', prodResult.reason!);
        return {
          success: false,
          summary: `Production monitoring failed: ${prodResult.reason}`,
          metricsCollected: this.metrics.length,
          healingAttempts
        };
      }

      // Success!
      this.setState(DeploymentState.SUCCESS);
      this.log('\n' + '='.repeat(70));
      this.log('✅ DEPLOYMENT SUCCESSFUL - All checks passed!');
      this.log('='.repeat(70));

      const summary = this.generateDeploymentSummary();

      return {
        success: true,
        summary,
        metricsCollected: this.metrics.length,
        healingAttempts
      };

    } catch (error) {
      this.log(`❌ Deployment error: ${error}`);
      await this.rollback(config.environment, String(error));

      return {
        success: false,
        summary: `Deployment error: ${error}`,
        metricsCollected: this.metrics.length,
        healingAttempts
      };
    }
  }

  private async rollback(env: string, reason: string): Promise<void> {
    this.setState(DeploymentState.ROLLING_BACK);
    this.log(`⏪ Rolling back ${env} deployment...`);
    this.log(`   Reason: ${reason}`);
    await this.sleep(500);
    this.log('✅ Rollback complete');
  }

  private generateDeploymentSummary(): string {
    const avgErrorRate = this.metrics.reduce((sum, m) => sum + m.errorRate, 0) / this.metrics.length;
    const avgResponseTime = this.metrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / this.metrics.length;
    const maxErrorRate = Math.max(...this.metrics.map(m => m.errorRate));
    const p95ResponseTime = this.metrics
      .map(m => m.p95ResponseTime)
      .sort((a, b) => a - b)[Math.floor(this.metrics.length * 0.95)];

    return `
╔══════════════════════════════════════════════════════════════╗
║              DEPLOYMENT SUMMARY                              ║
╠══════════════════════════════════════════════════════════════╣
║  Metrics Collected:    ${this.metrics.toString().padStart(42)}║
║  Avg Error Rate:       ${avgErrorRate.toFixed(2)}%${' '.repeat(40 - avgErrorRate.toFixed(2).length)}║
║  Max Error Rate:       ${maxErrorRate.toFixed(2)}%${' '.repeat(40 - maxErrorRate.toFixed(2).length)}║
║  Avg Response Time:    ${avgResponseTime.toFixed(0)}ms${' '.repeat(39 - avgResponseTime.toFixed(0).length)}║
║  P95 Response Time:    ${p95ResponseTime}ms${' '.repeat(39 - p95ResponseTime.toString().length)}║
║  Healing Attempts:     ${this.knowledgeBase.remediationHistory.size}${' '.repeat(40 - this.knowledgeBase.remediationHistory.size.toString().length)}║
╠══════════════════════════════════════════════════════════════╣
║  Status: ✅ SUCCESS                                              ║
╚══════════════════════════════════════════════════════════════╝
    `.trim();
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private setState(state: DeploymentState) {
    this.state = state;
    console.log(`\n[${state}]`);
  }

  private log(message: string) {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    this.logs.push(`[${timestamp}] ${message}`);
    console.log(message);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private demoErrorChance = 0.15;
  private demoMode = true;

  setDemoMode(enabled: boolean, errorChance: number = 0.15) {
    this.demoMode = enabled;
    this.demoErrorChance = errorChance;
  }

  private shouldDemoError(): boolean {
    return this.demoMode && Math.random() < this.demoErrorChance;
  }

  getMetrics(): MonitoringMetrics[] {
    return this.metrics;
  }

  getKnowledgeBase(): DeploymentKnowledgeBase {
    return this.knowledgeBase;
  }
}

// ============================================================================
// DEMONSTRATION
// ============================================================================

async function demonstrateEnhancedDeployment() {
  const agent = new EnhancedDeploymentAgent();

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║        SELF-HEALING DEPLOYMENT & MONITORING SYSTEM         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  // Scenario 1: Successful deployment with gradual rollout
  console.log('\n\n📌 SCENARIO 1: SUCCESSFUL DEPLOYMENT (Gradual Rollout)');
  console.log('─'.repeat(70));
  agent.setDemoMode(true, 0.05); // Low error rate for success

  const result1 = await agent.deploy({
    environment: 'production',
    terraformDir: 'terraform',
    skipTests: false,
    stagingMonitorDuration: 2, // Shortened for demo
    productionMonitorDuration: 2,
    gradualRollout: true,
    errorThreshold: 5
  });

  console.log('\n' + result1.summary);

  // Scenario 2: Deployment with healing
  console.log('\n\n📌 SCENARIO 2: DEPLOYMENT WITH SELF-HEALING');
  console.log('─'.repeat(70));
  agent.setDemoMode(true, 0.3); // Higher error rate to trigger healing

  const result2 = await agent.deploy({
    environment: 'production',
    terraformDir: 'terraform',
    skipTests: true,
    stagingMonitorDuration: 1,
    productionMonitorDuration: 1,
    gradualRollout: false,
    errorThreshold: 5
  });

  console.log('\n' + result2.summary);
}

// Run demonstration
demonstrateEnhancedDeployment().catch(console.error);
