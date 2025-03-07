import { nowInSec } from './nowInSec';

describe('nowInSec', () => {
  it('should return current time in seconds', () => {
    const result = nowInSec();
    const expected = Math.floor(Date.now() / 1000);
    
    // Allow for 1 second difference since time might change between calls
    expect(Math.abs(result - expected)).toBeLessThanOrEqual(1);
  });

  it('should handle positive offset correctly', () => {
    const offset = 60; // 1 minute
    const result = nowInSec(offset);
    const expected = Math.floor(Date.now() / 1000) + offset;
    
    expect(Math.abs(result - expected)).toBeLessThanOrEqual(1);
  });

  it('should handle negative offset correctly', () => {
    const offset = -30; // -30 seconds
    const result = nowInSec(offset);
    const expected = Math.floor(Date.now() / 1000) + offset;
    
    expect(Math.abs(result - expected)).toBeLessThanOrEqual(1);
  });

  it('should return an integer', () => {
    const result = nowInSec();
    expect(Number.isInteger(result)).toBe(true);
  });
}); 