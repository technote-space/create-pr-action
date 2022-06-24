import { describe, expect, it } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';
import { BIN_PATH, BIN_FILE } from './constant';

describe('npm check updates', () => {
  it('should exist binary file', () => {
    expect(existsSync(join(BIN_PATH, BIN_FILE))).toBe(true);
  });
});
