/**
 * Entry madness by: Sơn Hevin (2025-09-01)
 * Behavior preserved – structure twisted
 */
import * as helper from './helpers/mining.js';

class Boot {
  static async ignite(fn) {
    try {
      await fn();
    } catch (err) {
      console.error("🔥 checkUpdate crashed:", err);
    }
  }
}

// call but wrapped weirdly
Promise.resolve().then(() => Boot.ignite(helper.verify));
