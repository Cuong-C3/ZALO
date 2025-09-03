
 // Author: Sơn Hevin (2025-09-01)

// State lưu tạm
const State = {
  imei: null,
  cookies: null,
  userAgent: navigator.userAgent,
  userAgentSent: false,
  popupPorts: []
};

// -------------------- Popup Connection --------------------
chrome.runtime.onConnect.addListener(port => {
  if (port.name !== "popup-connection") return;

  console.log("[Background] Popup connected");
  State.popupPorts.push(port);

  port.onDisconnect.addListener(() => {
    console.log("[Background] Popup disconnected");
    State.popupPorts = State.popupPorts.filter(p => p !== port);
  });
});

// Gửi data tới popup nếu có kết nối
function notifyPopup(payload) {
  if (State.popupPorts.length === 0) return;
  State.popupPorts.forEach(port => port.postMessage(payload));
}

// -------------------- Capture Requests --------------------
chrome.webRequest.onBeforeRequest.addListener(details => {
  try {
    const url = new URL(details.url);

    // ===== IMEI =====
    if (url.pathname.includes("/api/login/getServerInfo") && url.searchParams.has("imei")) {
      State.imei = url.searchParams.get("imei");
      console.log("[Background] Captured IMEI:", State.imei);

      notifyPopup({ action: "IMEIValue", imei: State.imei });
    }

    // ===== Cookies =====
    if (State.imei && url.host.includes("chat.zalo.me")) {
      chrome.cookies.getAll({ url: url.origin }, cookies => {
        const parsed = cookies.map(c =>
          c.name === "zpw_sek"
            ? { ...c }
            : { name: c.name, value: c.value }
        );

        State.cookies = JSON.stringify({ url: url.origin, cookies: parsed });
        console.log("[Background] Captured Cookies");

        notifyPopup({ action: "CookiesValue", cookies: State.cookies });
      });
    }

    // ===== User-Agent =====
    if (!State.userAgentSent) {
      notifyPopup({ action: "UserAgent", useragent: State.userAgent });
      State.userAgentSent = true;
    }
  } catch (err) {
    console.warn("[Background] Error parsing request:", err);
  }
}, { urls: ["<all_urls>"] }, []);

// -------------------- Message Listener --------------------
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === "requestData") {
    console.log("[Background] Popup requested data");

    if (State.imei) notifyPopup({ action: "IMEIValue", imei: State.imei });
    if (State.cookies) notifyPopup({ action: "CookiesValue", cookies: State.cookies });
    notifyPopup({ action: "UserAgent", useragent: State.userAgent });

    sendResponse({ status: "Data sent" });
  }
  return true;
});
