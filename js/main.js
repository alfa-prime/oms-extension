/**
 * main.js
 * Точка входа. Подключает всё вместе:
 *  - инициализация формы
 *  - навешивание обработчика поиска
 */

import { initForm } from "./form.js";
import { debounce } from "./utils.js";
import { searchPatient } from "./search.js";
import { fetchListMo } from "./listMo.js";

export function setupSearchHandler() {
  // Debounce-версия функции поиска (чтобы при множественных Enter не спамить запросами)
  const debouncedSearch = debounce(searchPatient, 500);
  // Навешиваем на кнопку
  document
    .getElementById("searchBtn")
    .addEventListener("click", debouncedSearch);
  // Навешиваем на Enter в любых input
  document.querySelectorAll("input").forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        debouncedSearch();
      }
    });
  });
}

// Запускаем всё при загрузке DOM
window.addEventListener("DOMContentLoaded", () => {
  initForm();
  setupSearchHandler();

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs.length) return;
    const tabId = tabs[0].id;

    chrome.tabs.sendMessage(tabId, { action: "FETCH_LIST_MO" }, (response) => {
      // Этот callback сработает, когда content.js вызовет sendResponse(...)
      if (!response) {
        showError("Нет ответа от content.js");
        return;
      }

      if (!response.success && response.status === 404) {
        // техработы: эндпоинт пока лежит
        showError("Список МО временно недоступен (404). Попробуйте позже.");
        return;
      } else if (!response.success) {
        // прочая ошибка
        showError("Не удалось получить список МО: " + response.status);
        return;
      }

      // Если мы сюда попали, значит success:true и data содержит JSON
      console.log("✅ МО получены (через content.js):", response.data);

      // …тут вы можете заполнить, например, <select id="moDropdown"> …
      // example:
      // renderMoDropdown(response.data);
    });
  });
});
