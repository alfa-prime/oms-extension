// URL эндпоинта API, к которому отправляется запрос на поиск пациента
const API_URL = "http://0.0.0.0:8000/api/oms-browser-extension/search";

// Debounce-функция: предотвращает частые вызовы функции (например, при нажатии Enter)
function debounce(fn, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Показать сообщение (ошибка или инфо)
function showMessage(msg, type = "info") {
  const messageEl = document.getElementById("message");
  messageEl.textContent = msg;
  messageEl.className = `message ${type}`;
  messageEl.style.display = "block";

  // Прячем прелоадер, возвращаем кнопку к норме
  document.getElementById("loading").style.display = "none";
  document.getElementById("searchBtn").disabled = false;
  document.getElementById("searchBtn").textContent = "Искать";
}

// Обёртка для показа ошибок
function showError(msg) {
  showMessage(msg, "error");
}

// Основной код запускается после загрузки страницы
window.addEventListener("DOMContentLoaded", () => {
  const now = new Date();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Установка значений дат по умолчанию (с начала предыдущего месяца по сегодня)
  document.getElementById("startDate").value =
    prevMonthStart.toLocaleDateString("sv-SE");
  document.getElementById("endDate").value = now.toLocaleDateString("sv-SE");

  // Фокус на поле "Фамилия" при открытии
  document.getElementById("lastname").focus();
  document.getElementById("lastname").select();

  // Подключение debounced версии поиска
  const debouncedSearch = debounce(searchPatient, 500);

  // Обработка Enter в любом input — вызывает поиск
  document.querySelectorAll("input").forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        debouncedSearch();
      }
    });
  });

  // Кнопка "Поиск" запускает поиск
  document
    .getElementById("searchBtn")
    .addEventListener("click", debouncedSearch);
});

// Функция поиска пациента
async function searchPatient() {
  const searchBtn = document.getElementById("searchBtn");
  const messageEl = document.getElementById("message");
  const loadingEl = document.getElementById("loading");
  const resultsList = document.getElementById("results");

  // Считываем значения из формы
  const last_name = document.getElementById("lastname").value.trim();
  const first_name = document.getElementById("firstname").value.trim();
  const middle_name = document.getElementById("middlename").value.trim();
  const birthday = document.getElementById("birthday").value.trim();
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  // Очистка результатов и сообщений
  messageEl.style.display = "none";
  messageEl.textContent = "";
  resultsList.innerHTML = "";
  loadingEl.style.display = "block";
  searchBtn.disabled = true;
  searchBtn.textContent = "Поиск...";

  // Простая валидация
  if (startDate > endDate) {
    showError("Дата начала не может быть позже даты окончания");
    return;
  }

  if (!last_name) {
    showError("Фамилия обязательна");
    return;
  }

  // Формируем тело запроса
  const payload = { last_name, start_date: startDate, end_date: endDate };
  if (first_name) payload.first_name = first_name;
  if (middle_name) payload.middle_name = middle_name;
  if (birthday) payload.birthday = birthday;

  try {
    // Запрос к API
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const results = await response.json();

    // Если вернулся не массив — ошибка
    if (!Array.isArray(results)) throw new Error("Записи не найдены");

    // ℹ️ Пустой результат — сообщаем
    if (results.length === 0) {
      showMessage("Записи не найдены", "info");
      return;
    }

    // Отрисовка каждого результата
    results.forEach((item, index) => {
      const person = `${item.Person_Surname} ${item.Person_Firname} ${item.Person_Secname} ${item.Person_Birthday}`;
      const card = item.EvnPS_NumCard;
      const hospDate = item.EvnPS_setDate;

      const li = document.createElement("li");
      li.innerHTML = `
        <div><strong>${person}</strong></div>
        <div><br></div>
        <div>Номер карты: ${card}</div>
        <div>Дата госпитализации: ${hospDate}</div>
        <div><br></div>
        <button class="select-btn" data-index="${index}">Выбрать</button>
      `;
      resultsList.appendChild(li);

      // Кнопка "Выбрать" вставляет данные на страницу
      li.querySelector("button").addEventListener("click", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (data) => {
              console.log("Вставка данных", data);
              const iframe = document.querySelector("iframe"); // укажи селектор точнее, если их несколько
              if (!iframe) {
                console.warn("iframe не найден");
                return;
              }

              const doc = iframe.contentWindow.document;
              const map = {
                'input[name="ReferralHospitalizationNumberTicket"]': "б/н",
                'input[name="ReferralHospitalizationMedIndications"]':
                  "Нетипичное течение заболевания и (или) отсутствие эффекта",
                'input[name="VidMpV008Code"]': "031",
                'input[name="VidMpV008"]':
                  "специализированная медицинская помощь",
                'input[name="CardNumber"]': "555",
                'input[name="HospitalizationInfoNameDepartment"]':
                  data.LpuSection_Name,
              };

              for (const [selector, value] of Object.entries(map)) {
                const el = doc.querySelector(selector);
                if (el) {
                  el.value = value;
                  // Чистим ошибочные классы и атрибуты
                  el.classList.remove("x-form-invalid-field");
                  el.setAttribute("aria-invalid", "false");
                  el.setAttribute("data-errorqtip", "");
                } else {
                  console.warn("Не найден элемент:", selector);
                }
              }
            },
            args: [item],
          });
        });
      });
    });
  } catch (err) {
    console.error("Ошибка API:", err);
    showError(err.message);
  } finally {
    // Прячем прелоадер и возвращаем кнопку
    loadingEl.style.display = "none";
    searchBtn.disabled = false;
    searchBtn.textContent = "Искать";
  }
}

// Вставка данных в форму на целевой странице
function insertData(data) {
  const map = {
    'input[name="ReferralHospitalizationNumberTicket"]': "б/н",
    'input[name="firstName"]': data.Person_Firname,
    'input[name="middleName"]': data.Person_Secname,
    'input[name="birthDate"]': data.Person_Birthday,
    'input[name="cardNumber"]': data.EvnPS_NumCard,
  };

  for (const [selector, value] of Object.entries(map)) {
    const el = document.querySelector(selector);
    if (el) el.value = value;
  }
}
