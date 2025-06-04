/**
 * main.js
 * Точка входа. Подключает всё вместе:
 *  - инициализация формы
 *  - навешивание обработчика поиска
 */

import { initForm } from "./form.js";
import { debounce } from "./utils.js";
import { searchPatient } from "./search.js";

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
});
