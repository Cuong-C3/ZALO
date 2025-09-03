/**
 * Robust version checker for popup UI (Kiwi/Chrome/Brave, MV2/MV3)
 * - Reads current version from runtime manifest (fallback to config)
 * - Fetches latest version from GitHub raw manifest
 * - Compares semver correctly (1.1.10 > 1.1.3)
 * - Updates #version text and #update-btn link/state
 */
import cfg from '../../connect.js';

const $ = (sel) => document.querySelector(sel);
const $version = $("#version");
const $btn = $("#update-btn");

function parseSemver(v) {
  if (!v) return [0,0,0];
  return String(v).split('.').map(x => parseInt(x,10) || 0).slice(0,3).concat([0,0,0]).slice(0,3);
}

function cmpSemver(a,b) {
  const A = parseSemver(a), B = parseSemver(b);
  for (let i=0;i<3;i++) {
    if (A[i] > B[i]) return 1;
    if (A[i] < B[i]) return -1;
  }
  return 0;
}

async function getCurrentVersion() {
  // Try chrome.runtime manifest
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
      const mv = chrome.runtime.getManifest();
      if (mv?.version) return mv.version;
    }
  } catch {}
  // MV2-compatible fallback: fetch packaged manifest.json
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
      const url = chrome.runtime.getURL('manifest.json');
      const res = await fetch(url);
      if (res.ok) {
        const j = await res.json();
        if (j?.version) return j.version;
      }
    }
  } catch {}
  // Last resort
  return cfg.FALLBACK_VERSION || "0.0.0";
}

async function getLatestVersion(signal) {
  const url = cfg.VERSION_CHECK_URL;
  const res = await fetch(url, { cache: 'no-store', redirect: 'follow', mode: 'cors', signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  if (!j?.version) throw new Error('Missing version in remote manifest');
  return j.version;
}

function setStatus(text) {
  if ($version) $version.textContent = text;
}

export async function verify() {
  try {
    setStatus('Checking...');
    const cur = await getCurrentVersion();
    let latest = cur;

    // time-bounded fetch (3s) so popup never hangs on weak mobile data
    const ctl = new AbortController();
    const timeout = setTimeout(() => ctl.abort(), 3000);
    try {
      latest = await getLatestVersion(ctl.signal);
    } catch (e) {
      console.warn('[Version] Remote check failed:', e?.message || e);
    } finally {
      clearTimeout(timeout);
    }

    const rel = cmpSemver(latest, cur);
    if (rel > 0) {
      // update available
      setStatus(`V${cur} → V${latest}`);
      if ($btn) {
        $btn.style.display = 'inline-flex';
        $btn.textContent = `Update V${latest}`;
        $btn.setAttribute('href', cfg.SOURCE_CODE_URL);
        $btn.setAttribute('target', '_blank');
        $btn.setAttribute('rel', 'noopener noreferrer');
      }
    } else {
      // up-to-date
      setStatus(`V${cur} (latest)`);
      if ($btn) {
        $btn.style.display = 'none';
      }
    }
  } catch (err) {
    console.error('[Version] check failed:', err);
    setStatus('Version check failed');
    if ($btn) $btn.style.display = 'none';
  }
}

// backward compat name
export const checkUpdate = verify;
