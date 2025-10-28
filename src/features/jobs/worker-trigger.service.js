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
      // Use Railway webhook URL if available (most reliable)
      const webhookUrl = process.env.RAILWAY_WEBHOOK_URL;
      
      if (webhookUrl) {
        console.log('[WorkerTrigger] Using Railway webhook...');
        const response = await axios.post(webhookUrl, {}, { timeout: 5000 });
        console.log('✅ Worker triggered via Railway webhook');
        return { triggered: true, method: 'webhook', timestamp: new Date() };
      }
      
      // Fallback: Try Railway GraphQL API
      console.log('[WorkerTrigger] Using Railway GraphQL API...');
      const response = await axios.post(
        'https://backboard.railway.app/graphql/v2',
        {
          query: `mutation { serviceInstanceRedeploy(serviceId: "${this.railwayServiceId}") }`
        },
        {
          headers: {
            'Authorization': `Bearer ${this.railwayApiToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data.errors) {
        console.error('[WorkerTrigger] Railway API error:', JSON.stringify(response.data.errors));
        return { triggered: false, error: response.data.errors };
      }

      console.log('✅ Worker triggered via Railway GraphQL API');
      return { triggered: true, method: 'graphql', timestamp: new Date() };

    } catch (error) {
      console.error('❌ Failed to trigger worker:', error.response?.data || error.message);
      
      // Return success anyway - worker might already be running
      console.log('⚠️ Continuing anyway - worker may already be active');
      return { 
        triggered: false, 
        error: error.response?.data || error.message,
        note: 'Worker may already be running or will start on next poll'
      };
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
