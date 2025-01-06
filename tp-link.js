require('dotenv').config(); // Wczytaj zmienne środowiskowe z pliku .env

const axios = require('axios');
const fs = require('fs');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const schedule = require('node-schedule');

// Stałe z pliku .env
const ROUTER_IP = process.env.ROUTER_IP;
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;

const WIFI_2G_SSID = process.env.WIFI_2G_SSID;
const WIFI_2G_ENCRY_PASSWORD = process.env.WIFI_2G_ENCRY_PASSWORD;
const WIFI_2G_PSK_KEY = process.env.WIFI_2G_PSK_KEY;
const WIFI_5G_SSID = process.env.WIFI_5G_SSID;
const WIFI_5G_ENCRY_PASSWORD = process.env.WIFI_5G_ENCRY_PASSWORD;
const WIFI_5G_PSK_KEY = process.env.WIFI_5G_PSK_KEY;

// Inicjalizacja axios z obsługą ciasteczek
const cookieJar = new CookieJar();
const client = wrapper(axios.create({ jar: cookieJar }));

// Dane do logowania
const loginData = {
  operation: 'login',
  username: USERNAME,
  password: PASSWORD
};

// Adres URL do logowania
const loginUrl = `http://${ROUTER_IP}/cgi-bin/luci/;stok=/login?form=login`;

// Nagłówki HTTP
const headers = {
  'Accept': 'application/json, text/javascript, */*; q=0.01',
  'Accept-Encoding': 'gzip, deflate',
  'Accept-Language': 'en-US,en',
  'Connection': 'keep-alive',
  'Content-Length': '296',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Host': ROUTER_IP,
  'Origin': `http://${ROUTER_IP}`,
  'Referer': `http://${ROUTER_IP}/webpages/login.html`,
  'Sec-GPC': '1',
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'X-Requested-With': 'XMLHttpRequest'
};

// Funkcja do logowania
async function login() {
  try {
    const response = await client.post(loginUrl, new URLSearchParams(loginData).toString(), { headers });

    // Sprawdzenie odpowiedzi
    if (response.status === 200) {
      console.log('Logowanie zakończone sukcesem!');
      console.log('Odpowiedź serwera:', response.data);

      // Pobranie stok z odpowiedzi
      //const stok = response.data.stok; // Zakładamy, że stok jest zwracany w odpowiedzi
      const stok = response.data.data.stok;
      if (!stok) {
        throw new Error('Nie znaleziono stok w odpowiedzi serwera.');
      }

      console.log('Stok:', stok);

      // Zapis ciasteczek do pliku
      const cookies = cookieJar.getCookiesSync(loginUrl);
      fs.writeFileSync('cookies.txt', JSON.stringify(cookies, null, 2));
      console.log('Ciasteczka zapisane do pliku cookies.txt');

      return stok; // Zwracamy stok do użycia w innych funkcjach
    } else {
      console.log('Logowanie nie powiodło się. Kod statusu:', response.status);
    }
  } catch (error) {
    console.error('Wystąpił błąd podczas logowania:', error.message);
  }
}

// Funkcja do włączenia Wi-Fi
async function enableWifi(stok) {
  try {
    const wifiUrl = `http://${ROUTER_IP}/cgi-bin/luci/;stok=${stok}/admin/wireless?form=wireless_2g&form=wireless_5g`;

    const wifiData = new URLSearchParams({
      operation: 'write',
      wireless_2g_enable: 'on', // Włączenie Wi-Fi 2.4 GHz
      wireless_2g_ssid: WIFI_2G_SSID,
      wireless_2g_hidden: 'off',
      wireless_2g_encry_password: WIFI_2G_ENCRY_PASSWORD,
      wireless_2g_psk_key: WIFI_2G_PSK_KEY,
      wireless_5g_enable: 'off', // Wyłączenie Wi-Fi 5 GHz
      wireless_5g_ssid: WIFI_5G_SSID,
      wireless_5g_hidden: 'off',
      wireless_5g_encry_password: WIFI_5G_ENCRY_PASSWORD,
      wireless_5g_psk_key: WIFI_5G_PSK_KEY,
      wireless_2g_disabled_all: 'off',
      wireless_5g_disabled_all: 'on',
      wireless_5g_2_disabled_all: 'on'
    }).toString();

    const wifiHeaders = {
      ...headers,
      'Content-Length': wifiData.length,
      'Referer': `http://${ROUTER_IP}/webpages/index.html`
    };

    const response = await client.post(wifiUrl, wifiData, { headers: wifiHeaders });

    if (response.status === 200) {
      console.log('Wi-Fi włączone pomyślnie!');
      //console.log('Odpowiedź serwera:', response.data);
    } else {
      console.log('Wystąpił błąd podczas włączania Wi-Fi. Kod statusu:', response.status);
    }
  } catch (error) {
    console.error('Wystąpił błąd podczas włączania Wi-Fi:', error.message);
  }
}

// Funkcja do wyłączania Wi-Fi
async function disableWifi(stok) {
  try {
    const wifiUrl = `http://${ROUTER_IP}/cgi-bin/luci/;stok=${stok}/admin/wireless?form=wireless_2g&form=wireless_5g`;

    const wifiData = new URLSearchParams({
      operation: 'write',
      wireless_2g_enable: 'off', // Wyłączenie Wi-Fi 2.4 GHz
      wireless_2g_ssid: WIFI_2G_SSID,
      wireless_2g_hidden: 'off',
      wireless_2g_encry_password: WIFI_2G_ENCRY_PASSWORD,
      wireless_2g_psk_key: WIFI_2G_PSK_KEY,
      wireless_5g_enable: 'off', // Wyłączenie Wi-Fi 5 GHz
      wireless_5g_ssid: WIFI_5G_SSID,
      wireless_5g_hidden: 'off',
      wireless_5g_encry_password: WIFI_5G_ENCRY_PASSWORD,
      wireless_5g_psk_key: WIFI_5G_PSK_KEY,
      wireless_2g_disabled_all: 'off',
      wireless_5g_disabled_all: 'on',
      wireless_5g_2_disabled_all: 'on'
    }).toString();

    const wifiHeaders = {
      ...headers,
      'Content-Length': wifiData.length,
      'Referer': `http://${ROUTER_IP}/webpages/index.html`
    };

    const response = await client.post(wifiUrl, wifiData, { headers: wifiHeaders });

    if (response.status === 200) {
      console.log('Wi-Fi wyłączone pomyślnie!');
      //console.log('Odpowiedź serwera:', response.data);
    } else {
      console.log('Wystąpił błąd podczas wyłączania Wi-Fi. Kod statusu:', response.status);
    }
  } catch (error) {
    console.error('Wystąpił błąd podczas wyłączania Wi-Fi:', error.message);
  }
}

// Funkcja do planowania włączenia/wyłączenia Wi-Fi
async function scheduleWifiAction(stok, action, cronExpression) {
  const job = schedule.scheduleJob(cronExpression, async () => {
    if (action === 'enable') {
      await enableWifi(stok);
    } else if (action === 'disable') {
      await disableWifi(stok);
    } else {
      console.log('Nieznana akcja. Dostępne akcje: enable, disable');
    }
  });

  console.log(`Zaplanowano ${action} Wi-Fi zgodnie z harmonogramem: ${cronExpression}`);
}

// Główna funkcja
async function main() {
  const stok = await login();

  if (stok) {
    // Przykład: Włącz Wi-Fi teraz
    //await enableWifi(stok);

    // Przykład: Wyłącz Wi-Fi teraz
    // await disableWifi(stok);

    // Przykład: Zaplanuj włączenie Wi-Fi codziennie o 8:00 rano
    scheduleWifiAction(stok, 'enable', '0 7 * * *');
    //scheduleWifiAction(stok, 'enable', '28 14 * * *');

    // Przykład: Zaplanuj wyłączenie Wi-Fi codziennie o 23:00 wieczorem
    scheduleWifiAction(stok, 'disable', '0 23 * * *');
    //scheduleWifiAction(stok, 'disable', '26 14 * * *');
  }
}

// Uruchomienie głównej funkcji
main();