const https = require('https');
const http = require('http');
const fs = require('fs');

// Load the source data
const fuentesBase = JSON.parse(fs.readFileSync('./frontend/src/data/fuentes-base.json', 'utf8'));
const regionsData = JSON.parse(fs.readFileSync('./frontend/src/data/demoSourcesByRegion.json', 'utf8'));

// Extract all URLs to check
const urlsToCheck = [];

// Add national sources
fuentesBase.sources.forEach(source => {
  urlsToCheck.push({ id: source.id, name: source.name, url: source.url, type: 'national' });
  if (source.rssUrl) {
    urlsToCheck.push({ id: source.id, name: `${source.name} RSS`, url: source.rssUrl, type: 'national-rss' });
  }
});

// Add regional sources
regionsData.regions.forEach(region => {
  if (region.sources && region.sources.length > 0) {
    region.sources.forEach(source => {
      urlsToCheck.push({ 
        id: source.id, 
        name: source.name, 
        url: source.url, 
        type: `regional-${region.name}` 
      });
    });
  }
});

async function checkUrl(urlObj) {
  return new Promise((resolve) => {
    const url = new URL(urlObj.url);
    const client = url.protocol === 'https:' ? https : http;
    
    const request = client.get(url, (res) => {
      resolve({ ...urlObj, status: res.statusCode, success: res.statusCode >= 200 && res.statusCode < 400 });
    }).on('error', (err) => {
      resolve({ ...urlObj, status: null, success: false, error: err.message });
    });
    
    // Set timeout to 10 seconds
    request.setTimeout(10000, () => {
      request.destroy();
      resolve({ ...urlObj, status: null, success: false, error: 'Timeout' });
    });
  });
}

async function checkAllUrls() {
  console.log(`Checking ${urlsToCheck.length} URLs...\n`);
  
  const results = await Promise.all(urlsToCheck.map(checkUrl));
  
  const workingUrls = results.filter(r => r.success);
  const brokenUrls = results.filter(r => !r.success);
  
  console.log(`Working URLs (${workingUrls.length}):`);
  console.log('=============================');
  workingUrls.forEach(result => {
    console.log(`${result.type} | ${result.name}: ${result.url} (${result.status})`);
  });
  
  console.log(`\nBroken URLs (${brokenUrls.length}):`);
  console.log('===========================');
  brokenUrls.forEach(result => {
    console.log(`${result.type} | ${result.name}: ${result.url} (Status: ${result.status || 'ERROR'}, Error: ${result.error || 'Unknown'})`);
  });
  
  return { workingUrls, brokenUrls };
}

checkAllUrls().then(({ workingUrls, brokenUrls }) => {
  console.log('\nSummary:');
  console.log(`Total URLs checked: ${workingUrls.length + brokenUrls.length}`);
  console.log(`Working: ${workingUrls.length}`);
  console.log(`Broken: ${brokenUrls.length}`);
});