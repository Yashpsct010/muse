const { generate } = require('youtube-po-token-generator');

async function runCached() {
  try {
    // This is the heavy lifting part that uses JSDOM
    const { poToken, visitorData } = await generate();
    
    // Send the results back to the parent process
    process.send({ poToken, visitorData });
    
    // Explicitly exit to clear JSDOM from memory instantly
    process.exit(0);
  } catch (err) {
    process.send({ error: err.message });
    process.exit(1);
  }
}

runCached();
