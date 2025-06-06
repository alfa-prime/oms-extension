/**
 * insert.js
 * Функция insertData (вставка данных в форму внутри iframe)
 * Оригинальный код без изменений.
 */

export function insertData(data) {
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
