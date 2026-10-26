import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after } from 'node:test';

// Each test process owns and removes its entire user-state directory.
const home = await fs.mkdtemp(path.join(os.tmpdir(), 'conceptor-test-state-'));
process.env.CONCEPTOR_HOME = home;
after(() => fs.rm(home, { recursive: true, force: true }));
