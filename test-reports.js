// Простой тест системы жалоб
const BASE_URL = 'http://localhost:3000';

async function makeRequest(method, url, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  return fetch(url, options);
}

async function testReportsSystem() {
  console.log('🧪 Тестирование системы жалоб...\n');

  try {
    // 1. Попробуем создать жалобу без авторизации (должна вернуть 401)
    console.log('1. Тест создания жалобы без авторизации...');
    const response1 = await makeRequest('POST', `${BASE_URL}/reports`, {
      type: 'point',
      reason: 'spam',
      description: 'Тестовая жалоба',
      pointId: 'test-point-id'
    });
    
    if (response1.status === 401) {
      console.log('✅ Правильно: требуется авторизация');
    } else {
      console.log('❌ Неожиданный статус:', response1.status);
    }

    // 2. Попробуем получить список жалоб без админских прав
    console.log('\n2. Тест получения жалоб без админских прав...');
    const response2 = await makeRequest('GET', `${BASE_URL}/admin/reports`);
    
    if (response2.status === 401) {
      console.log('✅ Правильно: требуется авторизация для админских функций');
    } else {
      console.log('❌ Неожиданный статус:', response2.status);
    }

    // 3. Проверим, что endpoints существуют
    console.log('\n3. Проверка существования endpoints...');
    
    const endpoints = [
      { method: 'POST', path: '/reports', body: {} },
      { method: 'GET', path: '/admin/reports' },
      { method: 'POST', path: '/admin/users/1/block', body: {} },
      { method: 'POST', path: '/admin/users/1/unblock', body: {} },
      { method: 'GET', path: '/admin/users/blocked' }
    ];

    for (const endpoint of endpoints) {
      const response = await makeRequest(endpoint.method, `${BASE_URL}${endpoint.path}`, endpoint.body);
      
      // Ожидаем 401 (Unauthorized) или 400 (Bad Request), но не 404 (Not Found)
      if (response.status === 404) {
        console.log(`❌ Endpoint не найден: ${endpoint.method} ${endpoint.path}`);
      } else if ([401, 400, 403].includes(response.status)) {
        console.log(`✅ Endpoint существует: ${endpoint.method} ${endpoint.path} (статус: ${response.status})`);
      } else {
        console.log(`⚠️  Неожиданный статус для ${endpoint.method} ${endpoint.path}: ${response.status}`);
      }
    }

    console.log('\n✅ Базовое тестирование завершено!');
    console.log('\n📋 Следующие шаги:');
    console.log('1. Создайте пользователя через /auth/register');
    console.log('2. Войдите через /auth/login и получите JWT токен');
    console.log('3. Создайте точку через /points');
    console.log('4. Создайте жалобу на точку через /reports с JWT токеном');
    console.log('5. Войдите как админ и обработайте жалобу через /admin/reports');

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

// Запускаем тест
testReportsSystem();