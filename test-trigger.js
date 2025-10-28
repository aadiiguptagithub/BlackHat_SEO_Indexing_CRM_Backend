const axios = require('axios');

async function testTrigger() {
  try {
    console.log('='.repeat(50));
    console.log('Testing Worker Auto-Trigger');
    console.log('='.repeat(50));
    
    // 1. Check status
    console.log('\n1️⃣ Checking worker status...');
    const status = await axios.get('http://localhost:4000/api/jobs/worker-status');
    console.log('   Status:', JSON.stringify(status.data.data, null, 2));
    
    if (!status.data.data.configured) {
      console.error('\n❌ Worker not configured!');
      console.log('   Fix: Check .env file has:');
      console.log('   - WORKER_TRIGGER_ENABLED=true');
      console.log('   - RAILWAY_API_TOKEN=...');
      console.log('   - RAILWAY_SERVICE_ID=...');
      return;
    }
    
    console.log('   ✅ Worker configured correctly');
    
    // 2. Get websites
    console.log('\n2️⃣ Getting websites...');
    const websites = await axios.get('http://localhost:4000/api/websites');
    
    if (!websites.data.data || websites.data.data.length === 0) {
      console.error('\n❌ No websites found!');
      console.log('   Fix: Add websites first from frontend');
      return;
    }
    
    const websiteIds = websites.data.data.slice(0, 3).map(w => w._id);
    console.log(`   Found ${websites.data.data.length} websites`);
    console.log(`   Using ${websiteIds.length} websites:`, websiteIds);
    
    // 3. Create job
    console.log('\n3️⃣ Creating job...');
    const job = await axios.post('http://localhost:4000/api/jobs', {
      name: 'Auto Trigger Test - ' + new Date().toLocaleTimeString(),
      messageTemplate: 'Testing worker auto-trigger functionality',
      websiteIds
    });
    
    console.log('   ✅ Job created:', job.data.data._id);
    console.log('   Submissions:', job.data.data.counts);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Test Complete!');
    console.log('='.repeat(50));
    console.log('\n📋 Check backend terminal for these logs:');
    console.log('   - "Job created with X submissions..."');
    console.log('   - "[WorkerTrigger] Checking configuration..."');
    console.log('   - "✅ Worker triggered successfully"');
    console.log('\n🚀 Check Railway dashboard for new deployment');
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Fix: Start backend first with: npm start');
    }
  }
}

testTrigger();
