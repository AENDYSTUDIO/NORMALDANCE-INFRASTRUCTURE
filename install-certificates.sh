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
cat > /etc/ssl/private/normaldance.key << 'EOF'
-----BEGIN RSA PRIVATE KEY-----
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
-----END RSA PRIVATE KEY-----
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