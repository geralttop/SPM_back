// Тестирование API жалоб
const BASE_URL = 'http://localhost:3000';

async function testReportsAPI() {
  console.log('🧪 Тестирование API жалоб...\n');

  try {
    // 1. Получаем список жалоб (нужен админский токен)
    console.log('1. Получение списка жалоб...');
    const reportsResponse = await fetch(`${BASE_URL}/admin/reports`, {
      headers: {
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE'
      }
    });
    
    if (reportsResponse.ok) {
      const reports = await reportsResponse.json();
      console.log('✅ Список жалоб получен:', reports.data?.length || 0, 'жалоб');
      
      if (reports.data && reports.data.length > 0) {
        const firstReport = reports.data[0];
        console.log('Первая жалоба:', {
          id: firstReport.id,
          type: firstReport.type,
          status: firstReport.status,
          hasPoint: !!firstReport.point,
          hasComment: !!firstReport.comment
        });
        
        // 2. Тестируем получение конкретной жалобы
        console.log('\n2. Получение конкретной жалобы...');
        const reportResponse = await fetch(`${BASE_URL}/admin/reports/${firstReport.id}`, {
          headers: {
            'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE'
          }
        });
        
        if (reportResponse.ok) {
          const report = await reportResponse.json();
          console.log('✅ Жалоба получена:', {
            id: report.id,
            type: report.type,
            status: report.status,
            reporter: report.reporter?.username,
            hasRelations: {
              point: !!report.point,
              comment: !!report.comment,
              reportedUser: !!report.reportedUser
            }
          });
        } else {
          console.log('❌ Ошибка получения жалобы:', reportResponse.status);
        }
      }
    } else {
      console.log('❌ Ошибка получения списка жалоб:', reportsResponse.status);
      const errorText = await reportsResponse.text();
      console.log('Ошибка:', errorText);
    }

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

// Функция для создания тестовой жалобы
async function createTestReport() {
  console.log('📝 Создание тестовой жалобы...');
  
  try {
    const response = await fetch(`${BASE_URL}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_USER_TOKEN_HERE'
      },
      body: JSON.stringify({
        type: 'point',
        reason: 'spam',
        description: 'Тестовая жалоба для проверки API',
        pointId: 'EXISTING_POINT_ID' // Замените на реальный ID точки
      })
    });

    if (response.ok) {
      const report = await response.json();
      console.log('✅ Жалоба создана:', report.id);
      return report.id;
    } else {
      console.log('❌ Ошибка создания жалобы:', response.status);
      const errorText = await response.text();
      console.log('Ошибка:', errorText);
    }
  } catch (error) {
    console.error('❌ Ошибка создания жалобы:', error.message);
  }
}

// Функция для тестирования обработки жалобы
async function testResolveReport(reportId) {
  console.log(`🔧 Тестирование обработки жалобы ${reportId}...`);
  
  try {
    const response = await fetch(`${BASE_URL}/admin/reports/${reportId}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE'
      },
      body: JSON.stringify({
        action: 'dismiss',
        adminNotes: 'Тестовое отклонение жалобы'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Жалоба обработана:', result.status);
    } else {
      console.log('❌ Ошибка обработки жалобы:', response.status);
      const errorText = await response.text();
      console.log('Ошибка:', errorText);
    }
  } catch (error) {
    console.error('❌ Ошибка обработки жалобы:', error.message);
  }
}

console.log('Для тестирования замените YOUR_ADMIN_TOKEN_HERE и YOUR_USER_TOKEN_HERE на реальные токены');
console.log('Также замените EXISTING_POINT_ID на реальный ID точки');
console.log('\nЗапуск тестов...\n');

testReportsAPI();