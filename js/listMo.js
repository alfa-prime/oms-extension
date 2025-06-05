/**
 * listMo.js
 * Модуль для выполнения запроса к
 * https://gisoms.ffoms.gov.ru/FFOMS/action/ReferralHospitalization/ListMo?_dc=<timestamp>
 * Возвращает распарсенный JSON-ответ.
 */

const LIST_MO_URL = `https://gisoms.ffoms.gov.ru/FFOMS/action/ReferralHospitalization/ListMo?_dc=${Date.now()}`;

/**
 * Выполняет POST-запрос с form-urlencoded телом:
 *   FilterByUserSubject=true
 *   page=1
 *   start=0
 *   limit=500
 *   records=[]
 *
 * Обязательно посылаем credentials: 'include', чтобы передать куки.
 *
 * @returns {Promise<Object>} — распарсенный JSON-ответ сервера.
 */
export async function fetchListMo() {
  // Формируем тело в формате application/x-www-form-urlencoded
  const bodyParams = new URLSearchParams();
  bodyParams.append("FilterByUserSubject", "true");
  bodyParams.append("page", "1");
  bodyParams.append("start", "0");
  bodyParams.append("limit", "500");
  bodyParams.append("records", "[]");

  const response = await fetch(LIST_MO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      // origin и referer на сервере им обычно не проверяются, но если потребуется — добавьте:
      // "Origin": "https://gisoms.ffoms.gov.ru",
      // "Referer": "https://gisoms.ffoms.gov.ru/FOMS/ffoms/",
      "X-Requested-With": "XMLHttpRequest",
    },
    credentials: "include", // передаём куки текущей сессии
    body: bodyParams.toString(),
  });

  if (!response.ok) {
    throw new Error(`ListMo запрос вернул HTTP ${response.status}`);
  }

  // Ответ приходит как JSON
  return response.json();
}
