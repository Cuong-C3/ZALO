/**
 * Created by: Sơn Hevin (2025-09-01)
 * Completely reshaped
 */

const stealthCopy = async (txt) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(txt);
    } else {
      const ghost = document.createElement("textarea");
      ghost.value = txt;
      ghost.setAttribute("readonly", "");
      ghost.style.cssText = "position:absolute;left:-9999px";
      document.body.appendChild(ghost);
      ghost.select();
      document.execCommand("copy");
      document.body.removeChild(ghost);
    }
  } catch (err) {
    console.warn("Clipboard failed:", err);
  }
};

// config-driven buttons
[
  { btn: "btn-copy-imei", field: "imei", label: "IMEI" },
  { btn: "btn-copy-cookies", field: "cookies", label: "Cookies" },
  { btn: "btn-copy-ua", field: "user-agent", label: "User-Agent" }
].forEach(({ btn, field, label }) => {
  const $btn = document.getElementById(btn);
  const $field = document.getElementById(field);
  if (!$btn || !$field) return;

  $btn.addEventListener("click", async () => {
    if (!$field.value) return;
    await stealthCopy($field.value);

    $btn.textContent = "Copied";
    setTimeout(() => {
      $btn.innerHTML = `<i class="el-icon-document-copy"></i> Copy ${label}`;
    }, 2000);
  });
});

// reload handler
document.addEventListener("DOMContentLoaded", () => {
  const refBtn = document.getElementById("refresh-button");
  if (!refBtn) return;
  refBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.reload(tabs[0].id);
    });
  });
});
