export function rateLimit({ interval, uniqueTokenPerInterval = 500 }) {
  const tokens = new Map();
  
  return {
    check: async (token = 'GLOBAL') => {
      const now = Date.now();
      const tokenCount = tokens.get(token) || [0];
      
      if (now - tokenCount[1] > interval) {
        tokens.set(token, [1, now]);
        return;
      }
      
      if (tokenCount[0] === uniqueTokenPerInterval) {
        throw new Error('Rate limit exceeded');
      }
      
      tokenCount[0] += 1;
      tokens.set(token, tokenCount);
    }
  };
} 