chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});

// const allowedUrls = ["https://gisoms.ffoms.gov.ru", "http://0.0.0.0:8000"];

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (changeInfo.status !== "complete") return;

//   const url = new URL(tab.url);
//   const isAllowed = allowedUrls.some((base) => url.href.startsWith(base));

//   if (isAllowed) {
//     chrome.action.enable(tabId);
//   } else {
//     chrome.action.disable(tabId);
//   }
// });
