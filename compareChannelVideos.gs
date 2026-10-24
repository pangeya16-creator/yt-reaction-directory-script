function compareChannelVideos() {
  // 1. Хендл канала
  var channelHandle = '@GrumpyWolfReacts';

  // 2. ИДЕНТИЧНЫЕ ПАРАМЕТРЫ ИЗ ОСНОВНОГО СКРИПТА
  var carpetPattern = /carpetman|carpet\s*man/i;
  var blackSoilPattern = /black\s*soil|blacksoil/i;
  var carpetPattern = /carpet[\s\_]*man|anyway,?\s*i\s*love\s*it/i;
  var EXCLUDE_REGEX = /shorts|skating|skate|choreography|cover|tutorial|teaser|trailer|remix|sub/i;
  
  var CUTOFF_DATE = new Date("2024-01-01T00:00:00Z");
  var MIN_DURATION_SECONDS = 180; // Строго от 3 минут (180 сек)

  var channelId = getChannelIdByHandle(channelHandle);
  if (!channelId) {
    Logger.log("❌ Канал не найден: " + channelHandle);
    return;
  }

  var uploadsPlaylistId = channelId.replace(/^UC/, 'UU');
  var rawItems = [];
  var nextPageToken = '';

  // Шаг 1: Сбор загрузок с канала
  do {
    var playlistResponse = YouTube.PlaylistItems.list('snippet', {
      playlistId: uploadsPlaylistId,
      maxResults: 50,
      pageToken: nextPageToken
    });

    if (playlistResponse && playlistResponse.items) {
      for (var k = 0; k < playlistResponse.items.length; k++) {
        var item = playlistResponse.items[k];
        var pubDate = new Date(item.snippet.publishedAt);
        if (pubDate < CUTOFF_DATE) continue;
        rawItems.push(item);
      }
    }
    nextPageToken = playlistResponse.nextPageToken;
  } while (nextPageToken);

  // Шаг 2: Фильтрация по названию и стоп-словам
  var candidateVideos = [];
  rawItems.forEach(function(item) {
    var rawTitle = item.snippet.title;
    var title = rawTitle
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");

    if (EXCLUDE_REGEX.test(title)) return;

    var hasCarpetman = carpetPattern.test(title);
    var hasBlackSoil = blackSoilPattern.test(title);

    if (hasCarpetman || hasBlackSoil) {
      candidateVideos.push({
        id: item.snippet.resourceId.videoId,
        title: title,
        pubDate: new Date(item.snippet.publishedAt)
      });
    }
  });

  // Шаг 3: Проверка длительности через YouTube API
  var candidateIds = candidateVideos.map(function(v) { return v.id; });
  var videoDetailsMap = {};

  for (var j = 0; j < candidateIds.length; j += 50) {
    var chunk = candidateIds.slice(j, j + 50);
    var detailsResponse = YouTube.Videos.list('contentDetails,statistics', { id: chunk.join(',') });
    
    if (detailsResponse && detailsResponse.items) {
      detailsResponse.items.forEach(function(video) {
        videoDetailsMap[video.id] = {
          duration: parseISO8601Duration(video.contentDetails ? video.contentDetails.duration : null),
          views: parseInt(video.statistics ? video.statistics.viewCount || 0 : 0, 10)
        };
      });
    }
  }

  // Шаг 4: Вывод ТОЛЬКО засчитанных реакций
  Logger.log("📋 ЗАСЧИТАННЫЕ РЕАКЦИИ ДЛЯ " + channelHandle + " (как в таблице):\n");
  var validCount = 0;
  var totalViews = 0;

  candidateVideos.forEach(function(v) {
    var details = videoDetailsMap[v.id];
    if (!details || details.duration < MIN_DURATION_SECONDS) return;

    validCount++;
    totalViews += details.views;
    Logger.log("✅ [" + validCount + "] " + v.title);
  });

  Logger.log("\nИтоговый подсчет: " + validCount + " реакций | Всего просмотров: " + totalViews);
}

// Вспомогательная функция парсинга длительности
function parseISO8601Duration(durationStr) {
  if (!durationStr) return 0;
  var match = durationStr.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  var hours = (parseInt(match[1]) || 0);
  var minutes = (parseInt(match[2]) || 0);
  var seconds = (parseInt(match[3]) || 0);
  return hours * 3600 + minutes * 60 + seconds;
}
