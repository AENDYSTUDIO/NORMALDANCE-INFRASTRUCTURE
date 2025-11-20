#!/bin/bash

echo "📜 Установка SSL сертификатов на сервер..."

# Создание директорий для сертификатов
mkdir -p /etc/ssl/certs
mkdir -p /etc/ssl/private

# Установка сертификата для normaldance.ru
cat > /etc/ssl/certs/normaldance.crt << 'EOF'
-----BEGIN CERTIFICATE-----
MIIHojCCBoqgAwIBAgIMHI/jRcZpG7gRIzQzMA0GCSqGSIb3DQEBCwUAMFMxCzAJ
BgNVBAYTAkJFMRkwFwYDVQQKExBHbG9iYWxTaWduIG52LXNhMSkwJwYDVQQDEyBH
bG9iYWxTaWduIEdDQyBSMyBEViBUTFMgQ0EgMjAyMDAeFw0yNTEwMDYwOTIyMDRa
Fw0yNjA1MDYyMzMyMTJaMB0xGzAZBgNVBAMTEnd3dy5ub3JtYWxkYW5jZS5ydTCC
AiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBALdOh8VP5KzOAbwLQsW6GfjE
ZaeSNqWUQnrSTeQ5QigQCkGX+Q5Dv20sKW/prbEBI/oKYm0e1kOovpa4msHIS1HA
CecKjdfbAVWXtOnBiZAUsR1e5c5DSgM8b0CHtAwZa73ABWa8tmMU0es2w9P5wexD
LRItrzDcT/fYL5bwPJsG5mNtEPxQsCWCrdcsJ/lx7DQCwXMxXc1RstKeypfsYQyG
Ymow/ioFh+dUDx8nhlORgNn/3T8szIAOJdvLwTkqnsY5Ebfpvn21tDNj8uLzn425
UUUVOYqqR+uCj9LlNtXT7SsoeZwt10f4D7YtoSS/A2C964ZW8yZBGEBPeBd1Zvtp
7YBmKSohlqp0lozIaENUtNnwQtttSk8a1WK32z/LYqeAs9862ceUzmOcDjcoybx5
0SFxfDKLhQkcew8w4X6dmJzQ986KwIWDBNKxDDYBTQkZuCic7w3l3cOlewvTk7Fo
2TdeMLPgynpQa4oHVBGxKHYaSnHed9C72qQbl7seZG/Hcm3ZTY/SIzvCrgGhPD/+
44rV/05Jbr/PVjNYjSs7gC/Zvz1ho19bl96YK8L6i9VljSiNWVtVWJethFo5BoZZ
Tv/D0ccijKDaQmBHuoUsfUwEHULtxK898NT6UV823kCnBobH3zce9Q3vuvIUGQC6
Xg6gA9ilwlYL8CdlTBOPAgMBAAGjggOqMIIDpjAOBgNVHQ8BAf8EBAMCBaAwDAYD
VR0TAQH/BAIwADCBkwYIKwYBBQUHAQEEgYYwgYMwRgYIKwYBBQUHMAKGOmh0dHA6
Ly9zZWN1cmUuZ2xvYmFsc2lnbi5jb20vY2FjZXJ0L2dzZ2NjcjNkdnRsc2NhMjAy
MC5jcnQwOQYIKwYBBQUHMAGGLWh0dHA6Ly9vY3NwLmdsb2JhbHNpZ24uY29tL2dz
Z2NjcjNkdnRsc2NhMjAyMDBWBgNVHSAETzBNMEEGCSsGAQQBoDIBCjA0MDIGCCsG
AQUFBwIBFiZodHRwczovL3d3dy5nbG9iYWxzaWduLmNvbS9yZXBvc2l0b3J5LzAI
BgZngQwBAgEwQQYDVR0fBDowODA2oDSgMoYwaHR0cDovL2NybC5nbG9iYWxzaWdu
LmNvbS9nc2djY3IzZHZ0bHNjYTIwMjAuY3JsMHMGA1UdEQRsMGqCEnd3dy5ub3Jt
YWxkYW5jZS5ydYIbYXV0b2Rpc2NvdmVyLm5vcm1hbGRhbmNlLnJ1ghNtYWlsLm5v
cm1hbGRhbmNlLnJ1ghJvd2Eubm9ybWFsZGFuY2UucnWCDm5vcm1hbGRhbmNlLnJ1
MB0GA1UdJQQWMBQGCCsGAQUFBwMBBggrBgEFBQcDAjAfBgNVHSMEGDAWgBQNmMBz
f6u9vdlHS0mtCkoMrD7HfDAdBgNVHQ4EFgQUoDbwfsKHXgwaHEduBwYdrlOp6pQw
ggF/BgorBgEEAdZ5AgQCBIIBbwSCAWsBaQB2AGQRxGykEuyniRyiAi4AvKtPKAfU
HjUnq+r+1QPJfc3wAAABmbjUCdgAAAQDAEcwRQIgCfaK8WU22iTqNI/ClOvHkGbc
qqDBOkuzbjNsCj5tvYgCIQCouceKOYN72iCc5uABZQPNQW3+XM3psYEFeWRlhfEE
WgB2AA5XlLzzrqk+MxssmQez95Dfm8I9cTIl3SGpJaxhxU4hAAABmbjUCcgAAAQD
AEcwRQIhANsjpM+9asLf8c2KvH7tbFV5nqQlBOT7lMFlbZNeQjaLAiAZQFawX15V
WbGD4/vo77ulh6zNnE8hajs2Nx9gKKphQwB3AEmcm2neHXzs/DbezYdkprhbrwqH
gBnRVVL76esp3fjDAAABmbjUCd0AAAQDAEgwRgIhAOLtcCgeUyNA5vVswKCB9e6+
GL+ot9enpmM7QFmoCWm3AiEA1BdW13rQxkdjIBEfAmZFLM0AmCi+NwrOfLXA3Bnr
YqkwDQYJKoZIhvcNAQELBQADggEBAFQWIsQ6smY1wmYJy/65B6+/xq523oS+TkSi
VjpVp8EEEplS1ZIUtjv7ZuQcyS6tJzLI3bIIs9m1g8XUXvDOcblRwj17jmvswmPA
PCtAgVR1rG/ObZkufDUFDu2Qs8YaKNvJH9x2Ff7V1ZQCM++aJBD7l69TVytgNoCk
TnIzFXYxXtjB6zLD7HfWZU7zpUCzdmc1X+pYgyOB81A7OHvCQgxkVxHvckeSacvQ
KdnFQwgza7GBSLvcgMX/FhdWqtfnfG+IOdYr1ogY+rKW80g/NVwR97i2+N+kyjvY
zFBrZpXXojv+WcgbyeD582SskI1m1NKSDHo1j8KONiC+89XeEe4=
-----END CERTIFICATE-----
EOF

# Установка приватного ключа для normaldance.ru
# ВНИМАНИЕ: Приватный ключ должен быть загружен из безопасного хранилища
# НЕ храните приватные ключи в исходном коде!
cat > /etc/ssl/private/normaldance.key << 'EOF'
# ПЕРЕМЕСТЕТЕ СЮДА РЕАЛЬНЫЙ ПРИВАТНЫЙ КЛЮЧ ИЗ БЕЗОПАСНОГО ХРАНИЛИЩА
# Пример загрузки из Vault:
# vault kv get -field=private_key secret/ssl/normaldance
EOF

# Установка промежуточного сертификата
cat > /etc/ssl/certs/normaldance-intermediate.crt << 'EOF'
-----BEGIN CERTIFICATE-----
MIIEsDCCA5igAwIBAgIQd70OB0LV2enQSdd00CpvmjANBgkqhkiG9w0BAQsFADBM
MSAwHgYDVQQLExdHbG9iYWxTaWduIFJvb3QgQ0EgLSBSMzETMBEGA1UEChMKR2xv
YmFsU2lnbjETMBEGA1UEAxMKR2xvYmFsU2lnbjAeFw0yMDA3MjgwMDAwMDBaFw0y
OTAzMTgwMDAwMDBaMFMxCzAJBgNVBAYTAkJFMRkwFwYDVQQKExBHbG9iYWxTaWdu
IG52LXNhMSkwJwYDVQQDEyBHbG9iYWxTaWduIEdDQyBSMyBEViBUTFMgQ0EgMjAy
MDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAKxnlJV/de+OpwyvCXAJ
IcxPCqkFPh1lttW2oljS3oUqPKq8qX6m7K0OVKaKG3GXi4CJ4fHVUgZYE6HRdjqj
hhnuHY6EBCBegcUFgPG0scB12Wi8BHm9zKjWxo3Y2bwhO8Fvr8R42pW0eINc6OTb
QXC0VWFCMVzpcqgz6X49KMZowAMFV6XqtItcG0cMS//9dOJs4oBlpuqX9INxMTGp
6EASAF9cnlAGy/RXkVS9nOLCCa7pCYV+WgDKLTF+OK2Vxw3RUJ/p8009lQeUARv2
UCcNNPCifYX1xIspvarkdjzLwzOdLahDdQbJON58zN4V+lMj0msg+c0KnywPIRp3
BMkCAwEAAaOCAYUwggGBMA4GA1UdDwEB/wQEAwIBhjAdBgNVHSUEFjAUBggrBgEF
BQcDAQYIKwYBBQUHAwIwEgYDVR0TAQH/BAgwBgEB/wIBADAdBgNVHQ4EFgQUDZjA
c3+rvb3ZR0tJrQpKDKw+x3wwHwYDVR0jBBgwFoAUj/BLf6guRSSuTVD6Y5qL3uLd
G7wwewYIKwYBBQUHAQEEbzBtMC4GCCsGAQUFBzABhiJodHRwOi8vb2NzcDIuZ2xv
YmFsc2lnbi5jb20vcm9vdHIzMDsGCCsGAQUFBzAChi9odHRwOi8vc2VjdXJlLmds
b2JhbHNpZ24uY29tL2NhY2VydC9yb290LXIzLmNydDA2BgNVHR8ELzAtMCugKaAn
hiVodHRwOi8vY3JsLmdsb2JhbHNpZ24uY29tL3Jvb3QtcjMuY3JsMEcGA1UdIARA
MD4wPAYEVR0gADA0MDIGCCsGAQUFBwIBFiZodHRwczovL3d3dy5nbG9iYWxzaWdu
LmNvbS9yZXBvc2l0b3J5LzANBgkqhkiG9w0BAQsFAAOCAQEAy8j/c550ea86oCkf
r2W+ptTCYe6iVzvo7H0V1vUEADJOWelTv07Obf+YkEatdN1Jg09ctgSNv2h+LMTk
KRZdAXmsE3N5ve+z1Oa9kuiu7284LjeS09zHJQB4DJJJkvtIbjL/ylMK1fbMHhAW
i0O194TWvH3XWZGXZ6ByxTUIv1+kAIql/Mt29PmKraTT5jrzcVzQ5A9jw16yysuR
XRrLODlkS1hyBjsfyTNZrmL1h117IFgntBA5SQNVl9ckedq5r4RSAU85jV8XK5UL
REjRZt2I6M9Po9QL7guFLu4sPFJpwR1sPJvubS2THeo7SxYoNDtdyBHs7euaGcMa
D/fayQ==
-----END CERTIFICATE-----
EOF

# Установка прав доступа
chmod 600 /etc/ssl/private/normaldance.key
chmod 644 /etc/ssl/certs/normaldance.crt
chmod 644 /etc/ssl/certs/normaldance-intermediate.crt

echo "✅ Сертификаты установлены"

# Создание объединенного сертификата (сертификат + промежуточный)
cat /etc/ssl/certs/normaldance.crt /etc/ssl/certs/normaldance-intermediate.crt > /etc/ssl/certs/normaldance-fullchain.crt

echo "📋 Проверка установки сертификатов:"
ls -la /etc/ssl/certs/normaldance*
ls -la /etc/ssl/private/normaldance.key

echo ""
echo "🎉 Сертификаты готовы для активации HTTPS!"