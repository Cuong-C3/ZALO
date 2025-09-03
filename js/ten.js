/**
 * Sybau
 */

window.addEventListener("DOMContentLoaded", () => {
  const buttonContainer = document.querySelector(".button-container");
  const refreshBtn = document.getElementById("refresh-button");

  if (!buttonContainer || !refreshBtn) return;

  // mở port với background
  const port = chrome.runtime.connect({ name: "popup-link" });

  // xin dữ liệu khi popup mở
  chrome.runtime.sendMessage({ action: "requestData" }, (res) =>
    console.log("Popup init request:", res)
  );

  // cấu hình field mapping
  const fieldMap = {
    IMEIValue: { id: "imei", label: "IMEI" },
    CookiesValue: { id: "cookies", label: "Cookies" },
    UserAgent: { id: "user-agent", label: "User-Agent" },
  };

  // nhận dữ liệu từ background
  chrome.runtime.onMessage.addListener((req) => {
    const map = fieldMap[req.action];
    if (!map) return;
    const input = document.getElementById(map.id);
    if (!input) return;
    input.value = req[map.id.replace("-", "")] || req.imei || req.cookies || req.useragent;
    const parent = input.parentElement;
    if (parent?.classList) parent.classList.remove("is-disabled");
  });

  // refresh button
  refreshBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "requestData" }, (res) =>
      console.log("Refreshed:", res)
    );
  });

  // copy buttons
  Object.values(fieldMap).forEach(({ id, label }) => {
    const btn = document.getElementById(`btn-copy-${id.replace("-", "")}`);
    const field = document.getElementById(id);
    if (!btn || !field) return;
    btn.addEventListener("click", async () => {
      if (!field.value) return;
      await copyToClipboard(field.value);
      showNotification(`${label} đã được sao chép!`);
    });
  });
});

// modern clipboard
async function copyToClipboard(txt) {
  try {
    await navigator.clipboard.writeText(txt);
  } catch {
    const el = document.createElement("textarea");
    el.value = txt;
    el.style.position = "fixed";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
}

// 1 notification node duy nhất
let notifyNode = null;
function showNotification(msg) {
  if (!notifyNode) {
    notifyNode = document.createElement("div");
    notifyNode.className = "copy-notification";
    Object.assign(notifyNode.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      backgroundColor: "#4CAF50",
      color: "#fff",
      padding: "10px 20px",
      borderRadius: "5px",
      boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
      opacity: "0",
      transition: "opacity 0.3s ease",
      zIndex: 9999,
    });
    document.body.appendChild(notifyNode);
  }

  notifyNode.textContent = msg;
  notifyNode.style.opacity = "1";

  setTimeout(() => (notifyNode.style.opacity = "0"), 2000);
    }
