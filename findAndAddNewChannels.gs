function findAndAddNewChannels() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName("Channel") || spreadsheet.getActiveSheet();
  var lastRow = sheet.getLastRow();

  // 1. Собираем список уже имеющихся каналов/хэндлов (нормализуем нижний регистр)
  var existingHandles = new Set();
  if (lastRow >= 2) {
    var existingLinks = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    for (var i = 0; i < existingLinks.length; i++) {
      var link = String(existingLinks[i][0] || '').trim();
      var handle = extractHandleForSearch(link);
      if (handle) {
        existingHandles.add(handle.toLowerCase());
      }
    }
  }

  // Поисковые запросы по артистам
  var searchQueries = ['Carpetman', 'Carpet man', 'Black Soil', 'BlackSoil'];

  // Регулярные выражения для проверки названия видео
  var carpetPattern = /carpet[\s\_]*man/i;
  var blackSoilPattern = /black[\s\_]*soil/i;

  // Расширенный список стоп-слов
  var stopWordsPattern = /mash\-?up|cover|remix|edit|speed\s*up|slowed|bass\s*boosted|full\s*album|lyrics|karaoke|instrumental|teaser|trailer|concert/i;

  var newChannelsFound = 0;

  try {
    for (var q = 0; q < searchQueries.length; q++) {
      var nextPageToken = '';
      var pagesToFetch = 2; // Умеренный поиск (по 2 страницы на запрос)

      for (var page = 0; page < pagesToFetch; page++) {
        var searchParams = {
          q: searchQueries[q],
          maxResults: 50,
          type: 'video',
          order: 'date'
        };

        if (nextPageToken) searchParams.pageToken = nextPageToken;

        var searchResponse;
        try {
          searchResponse = YouTube.Search.list('snippet', searchParams);
        } catch (e) {
          Logger.log("⚠️ Ошибка API YouTube для запроса '" + searchQueries[q] + "': " + e.message);
          break;
        }

        if (!searchResponse || !searchResponse.items || searchResponse.items.length === 0) break;

        var videoIds = searchResponse.items.map(function(item) {
          return item.id ? item.id.videoId : null;
        }).filter(Boolean);

        if (videoIds.length === 0) continue;

        // Запрашиваем детали видео (длительность)
        var videoDetailsResponse = YouTube.Videos.list('contentDetails', {
          id: videoIds.join(',')
        });

        var videoDurationMap = {};
        if (videoDetailsResponse && videoDetailsResponse.items) {
          for (var v = 0; v < videoDetailsResponse.items.length; v++) {
            var vItem = videoDetailsResponse.items[v];
            videoDurationMap[vItem.id] = parseISO8601DurationSearch(vItem.contentDetails.duration);
          }
        }

        for (var j = 0; j < searchResponse.items.length; j++) {
          var item = searchResponse.items[j];
          var videoId = item.id.videoId;
          var title = item.snippet.title;

          // 1. ПРОВЕРКА ДЛИТЕЛЬНОСТИ (от 3 минут / 180 сек)
          var durationInSeconds = videoDurationMap[videoId] || 0;
          if (durationInSeconds < 180) continue;

          // 2. ПРОВЕРКА НАЗВАНИЯ
          var hasArtist = carpetPattern.test(title) || blackSoilPattern.test(title);
          var isNotTrash = !stopWordsPattern.test(title);

          if (hasArtist && isNotTrash) {
            var channelId = item.snippet.channelId;

            var channelResponse;
            try {
              channelResponse = YouTube.Channels.list('snippet', { id: channelId });
            } catch (err) {
              continue;
            }

            if (!channelResponse || !channelResponse.items || channelResponse.items.length === 0) continue;

            var channelItem = channelResponse.items[0];
            var customUrl = channelItem.snippet.customUrl;

            var formattedHandle = customUrl
              ? (customUrl.startsWith('@') ? customUrl : '@' + customUrl)
              : '@' + channelId;

            // Если канала ещё нет в таблице — добавляем
            if (!existingHandles.has(formattedHandle.toLowerCase())) {
              var channelTitle = channelItem.snippet.title;
              var channelLink = "https://www.youtube.com/" + formattedHandle;

              sheet.appendRow([
                channelTitle,
                channelLink,
                "", "", "", "", "", "", "", "", "", "no" // Столбец L (Show) теперь "no"
              ]);

            	existingHandles.add(formattedHandle.toLowerCase());
              newChannelsFound++;
              Logger.log("➕ Добавлен новый канал: " + channelTitle + " (" + formattedHandle + ")");
            }
          }
        }

        nextPageToken = searchResponse.nextPageToken;
        if (!nextPageToken) break;
      }
    }
  } catch (e) {
    Logger.log("⚠️ Ошибка при поиске новых каналов: " + e.message);
  }

  Logger.log("🎉 Поиск завершен. Добавлено новых каналов: " + newChannelsFound);
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

function parseISO8601DurationSearch(duration) {
  if (!duration) return 0;
  var match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  var hours = parseInt(match[1] || 0, 10);
  var minutes = parseInt(match[2] || 0, 10);
  var seconds = parseInt(match[3] || 0, 10);
  return hours * 3600 + minutes * 60 + seconds;
}

function extractHandleForSearch(url) {
  if (!url) return "";
  var match = String(url).match(/youtube\.com\/(channel\/|c\/|user\/|@)?([^\/\?]+)/);
  if (match) {
    if (url.includes('/@')) return '@' + match[2];
    return match[2];
  }
  return "";
}
