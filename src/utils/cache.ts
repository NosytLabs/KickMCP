import NodeCache from 'node-cache';

export const cache = new NodeCache({
  stdTTL: 600, // 10 minutes
  checkperiod: 120 // 2 minutes
});

export const setupCache = () => {
  return cache;
}; 