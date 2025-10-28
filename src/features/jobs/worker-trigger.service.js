/**
 * Worker Trigger Service
 * Triggers Railway worker when jobs are created
 */

const axios = require('axios');

class WorkerTriggerService {
  constructor() {
    this.railwayApiToken = process.env.RAILWAY_API_TOKEN;
    this.railwayServiceId = process.env.RAILWAY_SERVICE_ID;
    this.enabled = process.env.WORKER_TRIGGER_ENABLED === 'true';
  }

  /**
   * Check if worker trigger is configured
   */
  isConfigured() {
    return !!(this.enabled && this.railwayApiToken && this.railwayServiceId);
  }

  /**
   * Trigger worker deployment on Railway
   */
  async triggerWorker() {
    if (!this.isConfigured()) {
      console.log('Worker trigger not configured, skipping');
      return { triggered: false, reason: 'not_configured' };
    }

    try {
      // Railway GraphQL API to trigger deployment
      const query = `
        mutation {
          serviceInstanceRedeploy(input: {serviceId: "${this.railwayServiceId}"}) {
            id
          }
        }
      `;

      const response = await axios.post(
        'https://backboard.railway.app/graphql/v2',
        { query },
        {
          headers: {
            'Authorization': `Bearer ${this.railwayApiToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data.errors) {
        console.error('Railway API error:', response.data.errors);
        return { triggered: false, error: response.data.errors };
      }

      console.log('✅ Worker triggered successfully via Railway API');
      return { triggered: true, timestamp: new Date() };

    } catch (error) {
      console.error('❌ Failed to trigger worker:', error.message);
      return { triggered: false, error: error.message };
    }
  }

  /**
   * Check if there are pending tasks
   */
  async hasPendingTasks() {
    const Submission = require('../../models/Submission');
    const count = await Submission.countDocuments({ 
      status: { $in: ['pending', 'running'] } 
    });
    return count > 0;
  }

  /**
   * Smart trigger - only trigger if tasks exist
   */
  async smartTrigger() {
    console.log('[WorkerTrigger] Checking configuration...');
    console.log('[WorkerTrigger] Enabled:', this.enabled);
    console.log('[WorkerTrigger] Has API Token:', !!this.railwayApiToken);
    console.log('[WorkerTrigger] Has Service ID:', !!this.railwayServiceId);
    
    const hasTasks = await this.hasPendingTasks();
    console.log('[WorkerTrigger] Pending tasks:', hasTasks);
    
    if (!hasTasks) {
      console.log('[WorkerTrigger] No pending tasks, skipping worker trigger');
      return { triggered: false, reason: 'no_tasks' };
    }

    return await this.triggerWorker();
  }
}

module.exports = new WorkerTriggerService();
