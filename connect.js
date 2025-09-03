const FALLBACK = (() => {
  try {
    return (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest)
      ? chrome.runtime.getManifest().version
      : null;
  } catch { return null; }
})();

const CONFIG = Object.freeze({
  VERSION_CHECK_URL: "https://raw.githubusercontent.com/Cuong-C3/ZALO/main/manifest.json",
  SOURCE_CODE_URL:   "https://github.com/Cuong-C3/ZALO",
  FALLBACK_VERSION:  FALLBACK || "0.0.0"
});

export default CONFIG;
