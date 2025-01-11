### Stworzenie bota, który będzie wyłączał/włączał wifi na routerze w ustalonych godzinach.

Jako, że router nie posiada natywnie opcji schedulera, który by umożliwił ustawienie harmonogramu włączania i wyłączania wifi, należy zasymulować użytkownika, który loguje się do routera a następnie ręcznie wyłącza/włącza wifi.

Aby osiągnąć taki efekt, należy przeprowadzić reverse engeeniering. Analizujemy jak działa protokół komunikacji routera poprzez:

1. Obserwację ruchu sieciowego z przeglądarki
2. Testowanie różnych formatów żądań
3. Analizę odpowiedzi routera
4. Odtwarzanie procesu autoryzacji

### Po przeanalizowaniu nagłówków http testujemy to co udało nam się wywnioskować:

#### Włączanie wifi
curl -X POST "http://192.168.0.1/cgi-bin/luci/;stok=cfcd0828c510ba9e52d977eb905cd368/admin/wireless?form=wireless_2g&form=wireless_5g" -H "Accept: application/json, text/javascript, */*; q=0.01" -H "Accept-Encoding: gzip, deflate" -H "Accept-Language: en-US,en" -H "Connection: keep-alive" -H "Content-Length: 386" -H "Content-Type: application/x-www-form-urlencoded; charset=UTF-8" -H "Cookie: sysauth=d9291cd1fa80a126989bacc27c4e7041" -H "Host: 192.168.0.1" -H "Origin: http://192.168.0.1" -H "Referer: http://192.168.0.1/webpages/index.html" -H "Sec-GPC: 1" -H "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" -H "X-Requested-With: XMLHttpRequest" -d "operation=write&wireless_2g_enable=on&wireless_2g_ssid=GNET_D4&wireless_2g_hidden=off&wireless_2g_encry_password=10101010&wireless_2g_psk_key=10101010&wireless_5g_enable=off&wireless_5g_ssid=GNET_D_5G&wireless_5g_hidden=off&wireless_5g_encry_password=10101010&wireless_5g_psk_key=10101010&wireless_2g_disabled_all=off&wireless_5g_disabled_all=on&wireless_5g_2_disabled_all=on"

#### Wyłączanie wifi
curl -X POST "http://192.168.0.1/cgi-bin/luci/;stok=cfcd0828c510ba9e52d977eb905cd368/admin/wireless?form=wireless_2g&form=wireless_5g" -H "Accept: application/json, text/javascript, */*; q=0.01" -H "Accept-Encoding: gzip, deflate" -H "Accept-Language: en-US,en" -H "Connection: keep-alive" -H "Content-Length: 386" -H "Content-Type: application/x-www-form-urlencoded; charset=UTF-8" -H "Cookie: sysauth=d9291cd1fa80a126989bacc27c4e7041" -H "Host: 192.168.0.1" -H "Origin: http://192.168.0.1" -H "Referer: http://192.168.0.1/webpages/index.html" -H "Sec-GPC: 1" -H "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" -H "X-Requested-With: XMLHttpRequest" -d "operation=write&wireless_2g_enable=off&wireless_2g_ssid=GNET_D4&wireless_2g_hidden=off&wireless_2g_encry_password=10101010&wireless_2g_psk_key=10101010&wireless_5g_enable=off&wireless_5g_ssid=GNET_D4_5G&wireless_5g_hidden=off&wireless_5g_encry_password=10101010&wireless_5g_psk_key=10101010&wireless_2g_disabled_all=on&wireless_5g_disabled_all=on&wireless_5g_2_disabled_all=on"

#### Login daje nam taki rezultat
operation=login&username=admin&password=103943f6cb558f45fcf218c4545459f4bc5edd694813f754009190151cd757a7f0d501dde50a8f05937a56286810dc44434637948ef45454565ade9089fdb177d7c33be8b1ebd69826f9d30b84eccf97b0be2a5d012009268b59478de4d08bc6a4075555483eb2f6271e13d34ab729d7273a4f85791bac70f7e6054c1bc160ea

#### Testujemy logowanie, uzyskujemy cookie oraz stok potrzebne do autoryzacji

curl -X POST \
  "http://192.168.0.1/cgi-bin/luci/;stok=/login?form=login" \
  -H "Accept: application/json, text/javascript, */*; q=0.01" \
  -H "Accept-Encoding: gzip, deflate" \
  -H "Accept-Language: en-US,en" \
  -H "Connection: keep-alive" \
  -H "Content-Length: 296" \
  -H "Content-Type: application/x-www-form-urlencoded; charset=UTF-8" \
  -H "Host: 192.168.0.1" \
  -H "Origin: http://192.168.0.1" \
  -H "Referer: http://192.168.0.1/webpages/login.html" \
  -H "Sec-GPC: 1" \
  -H "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" \
  -H "X-Requested-With: XMLHttpRequest" \
  -d "operation=login&username=admin&password=103943f6cb558f45fcf218c4545459f4bc5edd694813f754009190151cd757a7f0d501dde50a8f05937a56286810dc44434637948ef45454565ade9089fdb177d7c33be8b1ebd69826f9d30b84eccf97b0be2a5d012009268b59478de4d08bc6a4075555483eb2f6271e13d34ab729d7273a4f85791bac70f7e6054c1bc160ea" \
  -c cookies.txt

{"success":true,"data":{"stok":"7cd4ade27010659cad9aa2c4b1851ecb"}}

sysauth	41f4b5055c3e079f07381a408e907c08

#### Piszemy bota, którego uruchamiamy na przykład na RaspberryPi.

Skrypt działa w tle jako usługa uruchomiona za pomocą na przykład pm2

