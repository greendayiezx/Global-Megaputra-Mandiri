import { describe, expect, it } from 'vitest';
import { regionChain } from './codes';

describe('regionChain', () => {
  it('expands a village code into its parents', () => {
    expect(regionChain('31.71.01.1001')).toEqual(['31', '31.71', '31.71.01', '31.71.01.1001']);
  });
  it('rejects anything that is not a Kemendagri code', () => {
    expect(regionChain('31.71.1')).toEqual([]);
    expect(regionChain("31' OR 1=1")).toEqual([]);
    expect(regionChain(null)).toEqual([]);
  });
});
