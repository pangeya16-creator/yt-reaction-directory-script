function testSingleChannelSearch() {
  // 159	Информация	
  var channelHandle = '@GrumpyWolfReacts'; // Замените на нужный хэндл канала
  
  // 2. КЛЮЧЕВЫЕ СЛОВА ДЛЯ ПОИСКА (Артисты)
  var searchKeywords = ['Carpetman', 'Black Soil']; 

  // Получаем ID канала по его хэндлу
  var channelId = getChannelIdByHandle(channelHandle);
  if (!channelId) {
    Logger.log("❌ Не удалось найти ID для канала: " + channelHandle);
    return;
  }

  Logger.log("🔎 Начинаем точечный поиск (Search.list) для канала: " + channelHandle + " (ID: " + channelId + ")");
  
  var foundVideosCount = 0;

  for (var k = 0; k < searchKeywords.length; k++) {
    var query = searchKeywords[k];
    Logger.log("\n--- Поисковый запрос: '" + query + "' ---");

    try {
      var searchResponse = YouTube.Search.list('snippet', {
        channelId: channelId,
        q: query,
        type: 'video',
        maxResults: 50
      });

      if (!searchResponse.items || searchResponse.items.length === 0) {
        Logger.log("Результатов по запросу '" + query + "' не найдено.");
        continue;
      }

      for (var i = 0; i < searchResponse.items.length; i++) {
        var item = searchResponse.items[i];
        var videoId = item.id.videoId;
        var videoTitle = item.snippet.title;
        var publishDate = item.snippet.publishedAt;

        foundVideosCount++;
        Logger.log("✅ [" + (i + 1) + "] " + videoTitle);
        Logger.log("   🔗 Ссылка: https://www.youtube.com/watch?v=" + videoId);
        Logger.log("   📅 Дата: " + publishDate);
      }

    } catch (e) {
      Logger.log("❌ Ошибка при выполнении запроса: " + e.message);
    }
  }

  Logger.log("\nИтог: Всего найдено роликов через Search.list: " + foundVideosCount);
}
