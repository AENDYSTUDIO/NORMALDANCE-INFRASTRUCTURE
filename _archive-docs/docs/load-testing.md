
# 🚀 Нагрузочное тестирование NORMAL DANCE

Этот документ описывает стратегию и методологию нагрузочного тестирования платформы NormalDance для оценки производительности и стабильности системы под высокой нагрузкой.

## 📊 Цели нагрузочного тестирования

### Основные цели
- **Оценка производительности**: Определение максимальной нагрузки, которую система может обработать
- **Идентификация узких мест**: Выявление компонентов, которые ограничивают производительность
- **Проверка стабильности**: Убедиться, что система остается стабильной под нагрузкой
- **Оценка масштабируемости**: Определение, как система масштабируется при увеличении нагрузки
- **Проверка времени отклика**: Убедиться, что время отклика остается в acceptable пределах

### Ключевые метрики
- **Время отклика (Response Time)**: Время ответа сервера на запрос
- **Пропускная способность (Throughput)**: Количество запросов в секунду
- **Использование ресурсов (Resource Usage)**: CPU, память, диск, сеть
- **Ошибки (Error Rate)**: Процент ошибочных запросов
- **Скорость обработки транзакций (Transaction Rate)**: Количество транзакций в секунду

## 🎯 Сценарии тестирования

### 1. Пиковая нагрузка (Peak Load)

#### Описание
Тестирование системы во время пиковых нагрузок, когда одновременно онлайн максимальное количество пользователей.

#### Параметры
- **Количество пользователей**: 10,000 одновременных пользователей
- **Длительность теста**: 30 минут
- **Паттерн нагрузки**: Равномерное распределение
- **Типы запросов**:
  - Поиск музыки: 40%
  - Воспроизведение треков: 30%
  - Профиль пользователя: 15%
  - Социальные функции: 15%

#### Ожидаемые результаты
- Время отклика: < 2 секунды
- Ошибки: < 0.1%
- Использование CPU: < 70%
- Использование памяти: < 80%

### 2. Стресс-тестирование (Stress Testing)

#### Описание
Тестирование системы при нагрузке, превышающей ожидаемую пиковую нагрузку, для определения точки отказа.

#### Параметры
- **Количество пользователей**: 15,000 - 50,000 пользователей
- **Длительность теста**: 60 минут
- **Инкремент нагрузки**: +1,000 пользователей каждые 5 минут
- **Типы запросов**: Все возможные операции платформы

#### Ожидаемые результаты
- Определение максимального количества пользователей
- Точка отказа и восстановление
- Время отклика при высокой нагрузке
- Процент ошибок при экстремальной нагрузке

### 3. Тестирование устойчивости (Endurance Testing)

#### Описание
Тестирование системы в течение длительного времени при постоянной нагрузке для выявления утечек памяти и деградации производительности.

#### Параметры
- **Количество пользователей**: 5,000 постоянных пользователей
- **Длительность теста**: 24 часа
- **Паттерн нагрузки**: Волнообразный (пики и спады)
- **Мониторинг**: Непрерывный мониторинг ресурсов

#### Ожидаемые результаты
- Отсутствие утечек памяти
- Стабильная производительность в течение 24 часов
- Отсутствие деградации времени отклика
- Стабильное использование ресурсов

### 4. Тестирование спайков (Spike Testing)

#### Описание
Тестирование реакции системы на резкое увеличение нагрузки.

#### Параметры
- **Базовая нагрузка**: 1,000 пользователей
- **Пиковая нагрузка**: 10,000 пользователей
- **Длительность пика**: 5 минут
- **Восстановление**: 10 минут после пика

#### Ожидаемые результаты
- Время восстановления после пика
- Процент потерянных запросов
- Время отклика во время пика
- Восстановление нормальной работы

## 🛠️ Инструменты и технологии

### Основные инструменты
| Инструмент | Назначение | Версия |
|------------|------------|--------|
| **k6** | Нагрузочное тестирование API | v0.47.0 |
| **Locust** | Нагрузочное тестирование веб-интерфейса | v2.29.1 |
| **JMeter** | Комплексное нагрузочное тестирование | v5.6.3 |
| **Grafana** | Мониторинг и визуализация метрик | v11.0.0 |
| **Prometheus** | Сбор и хранение метрик | v2.47.2 |
| **ELK Stack** | Анализ логов | v8.11.0 |

### Инфраструктура тестирования
- **Виртуальные машины**: 10x c5.2xlarge (AWS)
- **База данных**: PostgreSQL 15.0 с репликацией
- **Кэш**: Redis 7.0.11 кластер
- **Балансировщик**: AWS ALB
- **CDN**: CloudFront

## 📝 Конфигурация тестов

### k6 тест для API
```javascript
// load-tests/api-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Кастомные метрики
export let errorRate = new Rate('errors');
export let loginCounter = new Counter('logins_total');
export let searchTrend = new Trend('search_duration');

export let options = {
  stages: [
    { duration: '2m', target: 1000 },   // Нагрузка до 1,000 пользователей
    { duration: '5m', target: 5000 },   // Нагрузка до 5,000 пользователей
    { duration: '10m', target: 10000 }, // Нагрузка до 10,000 пользователей
    { duration: '5m', target: 5000 },   // Снижение нагрузки
    { duration: '2m', target: 0 },      // Остановка теста
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% запросов должны быть быстрее 2 секунд
    http_req_failed: ['rate<0.001'],   // Меньше 0.1% ошибок
  },
};

const BASE_URL = 'https://api.normaldance.com';
const SEARCH_WEIGHT = 0.4;
const PLAY_WEIGHT = 0.3;
const PROFILE_WEIGHT = 0.15;
const SOCIAL_WEIGHT = 0.15;

export default function () {
  // Случайный выбор операции
  let operation = Math.random();
  
  if (operation < SEARCH_WEIGHT) {
    // Поиск музыки
    searchMusic();
  } else if (operation < SEARCH_WEIGHT + PLAY_WEIGHT) {
    // Воспроизведение трека
    playTrack();
  } else if (operation < SEARCH_WEIGHT + PLAY_WEIGHT + PROFILE_WEIGHT) {
    // Профиль пользователя
    userProfile();
  } else {
    // Социальные функции
    socialFeatures();
  }
  
  sleep(1); // Имитация паузы между действиями пользователя
}

function searchMusic() {
  const response = http.get(`${BASE_URL}/api/search?q=test&type=track`);
  searchTrend.add(response.timings.duration);
  check(response, {
    'search status is 200': (r) => r.status === 200,
    'search response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  errorRate.add(response.status !== 200);
}

function playTrack() {
  const trackId = Math.floor(Math.random() * 10000) + 1;
  const response = http.post(`${BASE_URL}/api/playback/play`, JSON.stringify({
    trackId: trackId,
    userId: __VU.toString()
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(response, {
    'play status is 200': (r) => r.status === 200,
    'play response time < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(response.status !== 200);
}

function userProfile() {
  const userId = Math.floor(Math.random() * 10000) + 1;
  const response = http.get(`${BASE_URL}/api/users/${userId}/profile`);
  check(response, {
    'profile status is 200': (r) => r.status === 200,
    'profile response time < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(response.status !== 200);
}

function socialFeatures() {
  const operations = ['like', 'follow', 'comment'];
  const operation = operations[Math.floor(Math.random() * operations.length)];
  const userId = Math.floor(Math.random() * 10000) + 1;
  const targetId = Math.floor(Math.random() * 10000) + 1;
  
  const response = http.post(`${BASE_URL}/api/social/${operation}`, JSON.stringify({
    userId: userId,
    targetId: targetId
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(response, {
    'social status is 200': (r) => r.status === 200,
    'social response time < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(response.status !== 200);
}
```

### Locust тест для веб-интерфейса
```python
# load-tests/web_test.py
from locust import HttpUser, task, between, events
import random
import json

class NormalDanceUser(HttpUser):
    wait_time = between(1, 5)
    host = "https://normaldance.com"
    
    def on_start(self):
        """Инициализация пользователя при старте"""
        self.user_id = random.randint(1, 10000)
        self.session_token = None
        self.login()
    
    def login(self):
        """Авторизация пользователя"""
        response = self.client.post("/api/auth/login", json={
            "email": f"user{self.user_id}@example.com",
            "password": "password123"
        })
        if response.status_code == 200:
            self.session_token = response.json().get("token")
    
    @task(40)
    def search_music(self):
        """Поиск музыки"""
        with self.client.get(f"/api/search?q=test&type=track", catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Search failed with status {response.status_code}")
    
    @task(30)
    def play_track(self):
        """Воспроизведение трека"""
        track_id = random.randint(1, 10000)
        with self.client.post("/api/playback/play", json={
            "trackId": track_id,
            "userId": self.user_id
        }, catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Play failed with status {response.status_code}")
    
    @task(15)
    def user_profile(self):
        """Просмотр профиля пользователя"""
        with self.client.get(f"/api/users/{self.user_id}/profile", catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Profile failed with status {response.status_code}")
    
    @task(15)
    def social_features(self):
        """Социальные функции"""
        operations = ['like', 'follow', 'comment']
        operation = random.choice(operations)
        target_id = random.randint(1, 10000)
        
        with self.client.post(f"/api/social/{operation}", json={
            "userId": self.user_id,
            "targetId": target_id
        }, catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Social {operation} failed with status {response.status_code}")

@events.init.add_listener
def on_locust_init(environment, **kwargs):
    """Инициализация мониторинга"""
    if environment.web_ui:
        environment.web_ui.ctxmenu.append({
            'href': '/stats/overview',
            'text': 'Load Testing Dashboard'
        })
```

### JMeter тест для комплексного сценария
```xml
<!-- load-tests/comprehensive-test.jmx -->
<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0">
  <TestPlan>
    <Arguments>
      <Argument name="BASE_URL">https://api.normaldance.com</Argument>
      <Argument name="THREAD_COUNT">1000</Argument>
      <Argument name="RAMP_UP">300</Argument>
      <Argument name="DURATION">1800</Argument>
    </Arguments>
    
    <ThreadGroup>
      <Name>NormalDance Load Test</Name>
      <Arguments>
        <Argument name="THREAD_COUNT">${THREAD_COUNT}</Argument>
        <Argument name="RAMP_UP">${RAMP_UP}</Argument>
        <Argument name="DURATION">${DURATION}</Argument>
      </Arguments>
      
      <Sampler>
        <Name>Login</Name>
        <Arguments>
          <Argument name="URL">${BASE_URL}/api/auth/login</Argument>
          <Argument name="METHOD">POST</Argument>
          <Argument name="HEADERS">Content-Type: application/json</Argument>
          <Argument name="BODY">{"email": "user${__threadNum}@example.com", "password": "password123"}</Argument>
        </Arguments>
      </Sampler>
      
      <TransactionController>
        <Name>User Journey</Name>
        
        <ThroughputTimer>
          <Name>Think Time</Name>
          <Arguments>
            <Argument name="DURATION">1000-5000</Argument>
          </Arguments>
        </ThroughputTimer>
        
        <Sampler>
          <Name>Search Music</Name>
          <Arguments>
            <Argument name="URL">${BASE_URL}/api/search?q=test&type=track</Argument>
            <Argument name="METHOD">GET</Argument>
          </Arguments>
        </Sampler>
        
        <ThroughputTimer>
          <Name>Think Time</Name>
          <Arguments>
            <Argument name="DURATION">500-2000</Argument>
          </Arguments>
        </ThroughputTimer>
        
        <Sampler>
          <Name>Play Track</Name>
          <Arguments>
            <Argument name="URL">${BASE_URL}/api/playback/play</Argument>
            <Argument name="METHOD">POST</Argument>
            <Argument name="HEADERS">Content-Type: application/json</Argument>
            <Argument name="BODY">{"trackId": ${__Random(1,10000)}, "userId": ${__threadNum}}</Argument>
          </Arguments>
        </Sampler>
        
        <ThroughputTimer>
          <Name>Think Time</Name>
          <Arguments>
            <Argument name="DURATION">1000-3000</Argument>
          </Arguments>
        </ThroughputTimer>
        
        <Sampler>
          <Name>User Profile