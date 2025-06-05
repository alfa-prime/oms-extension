// js/content.js

// Этот файл будет выполняться в контексте страницы gisoms.ffoms.gov.ru,
// поэтому любые fetch-запросы, сделанные здесь, получат настоящие куки сайта.

// Логируем, чтобы убедиться, что скрипт загрузился:
console.log("✅ content.js загружен (страница).");

// Подписываемся на сообщения из popup/main.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Ожидаем запрос с action = "FETCH_LIST_MO"
  if (request.action === "FETCH_LIST_MO") {
    // Собираем URL с актуальным _dc
    const url = `https://gisoms.ffoms.gov.ru/FFOMS/action/ReferralHospitalization/ListMo?_dc=${Date.now()}`;

    // Формируем тело POST как x-www-form-urlencoded
    const bodyParams = new URLSearchParams({
      FilterByUserSubject: "true",
      page: "1",
      start: "0",
      limit: "500",
      records: "[]",
    }).toString();

    // Делаем fetch в контексте страницы (будут приложены куки)
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
      },
      credentials: "include", // чтобы передать cookie
      body: bodyParams,
    })
      .then((response) => {
        if (response.status === 404) {
          // Эндпоинт не готов (техработы) – отдадим null
          console.warn("ListMo вернул 404 (тех. работы).");
          sendResponse({ success: false, status: 404, data: null });
          return null;
        }
        if (!response.ok) {
          // Любой другой ненулевой статус (500, 403, ...) – бросаем ошибку
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((jsonData) => {
        if (jsonData !== null) {
          sendResponse({ success: true, status: 200, data: jsonData });
        }
      })
      .catch((err) => {
        console.error("Ошибка при fetchListMo в content.js:", err);
        sendResponse({ success: false, status: err.message, data: null });
      });

    // Говорим Chrome, что ответ придёт асинхронно
    return true;
  }
});
