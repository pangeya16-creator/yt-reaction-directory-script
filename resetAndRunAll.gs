// === УНИВЕРСАЛЬНЫЙ СПРАВОЧНИК ТРЕКОВ ===
var SONGS_DB = [
  { name: "Never Regret", pattern: /never[\s\-_]+regret/i },
  { name: "Night on Fire", pattern: /night[\s\-_]+on[\s\-_]+fire/i },
  { name: "Stay Close To Me", pattern: /stay[\s\-_]+close[\s\-_]+to[\s\-_]+me/i },
  { name: "Temple of the Rain", pattern: /temple[\s\-_]+of[\s\-_]+the[\s\-_]+rain/i },
  { name: "Prayin' for Pastor", pattern: /prayin[’']?[\s\-_]+for[\s\-_]+pastor/i },
  { name: "Tale of the Fox", pattern: /tale[\s\-_]+of[\s\-_]+the[\s\-_]+fox/i },
  { name: "Reflection", pattern: /reflection/i },
  { name: "K.O.W", pattern: /k[\s\-_]*\.?[\s\-_]*o[\s\-_]*\.?[\s\-_]*w/i },
  { name: "Silver Pull", pattern: /silver[\s\-_]+pull/i },
  { name: "Glowing Show", pattern: /glowing[\s\-_]+show/i },
  { name: "Ha Lo'", pattern: /ha[\s\-_]+lo[’']?/i },
  { name: "Talking much", pattern: /talking[\s\-_]+much/i },
  { name: "Live Innovation", pattern: /live[\s\-_]+innovation/i },
  { name: "Dance on My Bones", pattern: /dance[\s\-_]+on[\s\-_]+my[\s\-_]+bones/i },
  { name: "Gorgone", pattern: /gorgone/i },
  { name: "Other worlds", pattern: /other[\s\-_]+worlds/i },
  { name: "You Will Never Know it", pattern: /you[\s\-_]+will[\s\-_]+never[\s\-_]+know[\s\-_]+it/i },
  { name: "What Does It Mean To You", pattern: /what[\s\-_]+does[\s\-_]+it[\s\-_]+mean[\s\-_]+to[\s\-_]+you/i },
  { name: "Make It Lower", pattern: /make[\s\-_]+it[\s\-_]+lower/i },
  { name: "Nobody Cares", pattern: /nobody[\s\-_]+cares/i },
  { name: "You Have No Other Options", pattern: /you[\s\-_]+have[\s\-_]+no[\s\-_]+other[\s\-_]+options/i },
  { name: "Smoking Cherry", pattern: /smoking[\s\-_]+cherry/i },
  { name: "Golden Tears", pattern: /golden[\s\-_]+tears/i },
  { name: "What's goin' On", pattern: /what[’']?s[\s\-_]+goin[’']?[\s\-_]+on/i },
  { name: "Ain'tgottafeelthatpain", pattern: /ain[’']?t[\s\-_]*gotta[\s\-_]*feel[\s\-_]*that[\s\-_]*pain/i },
  { name: "Manuscript", pattern: /manuscript/i },
  { name: "Call Me Insane", pattern: /call[\s\-_]+me[\s\-_]+insane/i },
  { name: "Alleys of My Mind", pattern: /alleys[\s\-_]+of[\s\-_]+my[\s\-_]+mind/i },
  { name: "Let It Burn", pattern: /let[\s\-_]+it[\s\-_]+burn/i },
  { name: "Shades Of Gray", pattern: /shades[\s\-_]+of[\s\-_]+gray/i },
  { name: "WalKing Through the Code", pattern: /walking[\s\-_]+through[\s\-_]+the[\s\-_]+code/i },
  { name: "Trembling Island", pattern: /trembling[\s\-_]+island/i },
  { name: "Feel So Cold", pattern: /feel[\s\-_]+so[\s\-_]+cold/i },
  { name: "Anyway, I Love It", pattern: /anyway,?\s*i[\s\-_]+love[\s\-_]+it/i },
  { name: "Can't lose more", pattern: /can[’']?t[\s\-_]+lose[\s\-_]+more/i },
  { name: "Endless fight", pattern: /endless[\s\-_]+fight/i },
  { name: "My honey", pattern: /my[\s\-_]+honey/i },
  { name: "Live without a system", pattern: /live[\s\-_]+without[\s\-_]+a[\s\-_]+system/i },
  { name: "Struggling By Myself", pattern: /struggling[\s\-_]+by[\s\-_]+myself/i },
  { name: "OST Carpetwood", pattern: /carpetwood/i }
];

// Вспомогательная функция определения трека по названию видео
function detectSongName(videoTitle) {
  if (!videoTitle) return "";
  Logger.log("🔍 Проверяем видео: " + videoTitle); // <-- Добавьте эту строчку
  for (var i = 0; i < SONGS_DB.length; i++) {
    if (SONGS_DB[i].pattern.test(videoTitle)) {
      Logger.log("✅ Найден трек: " + SONGS_DB[i].name); // <-- И эту
      return SONGS_DB[i].name;
    }
  }
  Logger.log("❌ ТРЕК НЕ НАЙДЕН ДЛЯ: " + videoTitle); // <-- И эту
  return "";
}

// === 1. РУЧНОЙ СБРОС И ЗАПУСК ===
function resetAndRunAll() {
  PropertiesService.getScriptProperties().setProperty('LAST_PROCESSED_ROW', '2');
  runBatchProcessing();
}

// === 2. ОСНОВНАЯ ФУНКЦИЯ ОБРАБОТКИ ПАКЕТАМИ ===
function runBatchProcessing() {
  // Защита от параллельного запуска
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) {
    Logger.log("⚠️ Другой процесс уже выполняется. Пропуск.");
    return;
  }

  try {
    var startTime = new Date().getTime();
    var maxExecutionTimeMs = 5.5 * 60 * 1000; // Безопасные 5.5 минут

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName("Channel") || spreadsheet.getActiveSheet();

    var carpetPattern = /carpetman|carpet\s*man/i;
    var blackSoilPattern = /black\s*soil|blacksoil/i;
    var carpetPattern = /carpet[\s\_]*man|anyway,?\s*i\s*love\s*it/i;

    // Исключения для названий видео
    var EXCLUDE_REGEX = /shorts|skating|skate|choreography|cover|tutorial|teaser|trailer|remix|sub/i;

    // Видео ранее 01.01.2024 не проверяем
    var CUTOFF_DATE = new Date("2024-01-01T00:00:00Z");
    var MIN_DURATION_SECONDS = 180; // Строго от 3 минут

    var props = PropertiesService.getScriptProperties();
    var startRow = parseInt(props.getProperty('LAST_PROCESSED_ROW') || '2', 10);
    // var startRow = 5; // Принудительно начинаем с 5-й строки
    var lastRow = sheet.getLastRow();

    if (startRow > lastRow) {
      Logger.log("Все строки таблицы уже успешно обработаны!");
      props.setProperty('LAST_PROCESSED_ROW', '2');
      return;
    }

    var data = sheet.getRange(startRow, 1, lastRow - startRow + 1, 14).getValues();

    for (var i = 0; i < data.length; i++) {
    // for (var i = 0; i < 1; i++) { // Обработает ровно 1 строку (5-ю) и остановится
      var currentTime = new Date().getTime();
      if (currentTime - startTime > maxExecutionTimeMs) {
        var nextRow = startRow + i;
        props.setProperty('LAST_PROCESSED_ROW', nextRow.toString());
        Logger.log("Таймаут 3.5 минут. Остановка на строке " + nextRow);
        return;
      }

      var row = data[i];
      var currentRow = startRow + i;
      var channelUrl = String(row[1] || '').trim(); // Столбец B

      Logger.log("▶️ Обработка строки " + currentRow + ": " + channelUrl);

      var showStatus = String(row[11] || '').trim(); // Столбец L (Show)
      if (showStatus.toLowerCase() === 'no') {
        props.setProperty('LAST_PROCESSED_ROW', (currentRow + 1).toString());
        Logger.log("⏭ Пропуск строки " + currentRow + " (статус No)");
        continue;
      }

      if (!channelUrl) {
        props.setProperty('LAST_PROCESSED_ROW', (currentRow + 1).toString());
        continue;
      }

      var handle = extractChannelId(channelUrl);
      if (!handle) {
        props.setProperty('LAST_PROCESSED_ROW', (currentRow + 1).toString());
        continue;
      }

      var channelId = handle;
      if (channelId.startsWith("@")) {
        channelId = getChannelIdByHandle(channelId);
        if (!channelId) {
          props.setProperty('LAST_PROCESSED_ROW', (currentRow + 1).toString());
          continue;
        }
      }

      // 1. ПОЛУЧАЕМ МЕТРИКИ КАНАЛА (Подписчики, Аватар s800, Двухбуквенный код страны)
      var channelDetails = getChannelDetails(channelId);
      if (channelDetails) {
        sheet.getRange(currentRow, 3).setValue(channelDetails.subscriberCount); // Столбец C (Subscribers)
        sheet.getRange(currentRow, 5).setValue(channelDetails.avatarUrl);       // Столбец E (Avatar s800)
        
        // Перезаписываем страну только если ячейка F пустая ИЛИ API вернул конкретную страну
        var existingCountry = String(row[5] || '').trim(); // Текущее значение в колонке F
        if (!existingCountry || channelDetails.countryCode) {
          sheet.getRange(currentRow, 6).setValue(channelDetails.countryCode || existingCountry);
        }
      }

      // 2. ВАШ ИДЕАЛЬНЫЙ РАБОЧИЙ DEEPLINK (Столбец G)

      var deepLink = "https://www.youtube.com/@" + handle.replace("@", "") + "/search?query=%22Carpetman%22%20OR%20%22Black%20Soil%22";
      sheet.getRange(currentRow, 7).setValue(deepLink);

      // 3. ИЩЕМ ВИДЕО-РЕАКЦИИ через YouTube API
      var uploadsPlaylistId = channelId.replace(/^UC/, 'UU');
      var rawItems = [];
      var nextPageToken = '';

      try {
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
      } catch (e) {
        Logger.log("Ошибка доступа к каналу " + channelUrl + ": " + e.message);
        props.setProperty('LAST_PROCESSED_ROW', (currentRow + 1).toString());
        continue;
      }

      if (rawItems.length === 0) {
        sheet.getRange(currentRow, 8, 1, 4).setValues([[0, 0, "", ""]]);
        props.setProperty('LAST_PROCESSED_ROW', (currentRow + 1).toString());
        continue;
      }

// === НАСТРОЙКИ СПЕЦИФИЧЕСКИХ РОЛИКОВ ПО ID ===

// 1. Принудительно ВКЛЮЧИТЬ
var FORCED_INCLUDE_IDS = [
  "0HLXD9fSiKw", "54YJDs834EM", "C1xKSRLNE_0", "fu3t8xUj7oQ", "TOujKVFiJAA", "g9DpCKIaPWU", "R30uwh_c8lY", "2iT3-r5c2ew", "TQc34LLqo5k", "Kt_bMhJgH00", "neKXYZuAf_c", "ZAp1nD0kXtA"
];

// 2. Принудительно ИСКЛЮЧИТЬ (например, ролик про Kalush, где есть Carpetman)
var FORCED_EXCLUDE_IDS = [
  "Td_tjixB6z0","pQnBNy_N8T0", "z9oOM2yZT_4", "INlSK2nUtt8", "3xmagKuwYSM", "0xVVOjha3f0", "td9k1-1-jU0", "oWypwzCLpK8" // Вставьте сюда ID видео, которое нужно выкинуть
];

// 3. Принудительно ДОПИСАТЬ "x Black Soil" (если автор забыл второго артиста)
var FORCED_DUO_VIDEO_IDS = [
  "7-arxkx2iBk", "ymfoB4FB-nk", "joYferlJD2U"
];
// Принудительно задать артиста ТОЛЬКО как Black Soil
var FORCED_ONLY_BLACK_SOIL_IDS = [
  "T3oMdPCSrXo" // Вставьте сюда ID видео на Black Soil
];

// === ЛОГИКА ОБРАБОТКИ ===
var candidateVideos = [];

rawItems.forEach(function(item) {
  var videoId = item.snippet.resourceId.videoId;

  // ШАГ A: Если ID находится в списке ИСКЛЮЧЕНИЙ — сразу выкидываем ролик!
  if (FORCED_EXCLUDE_IDS.indexOf(videoId) !== -1) {
    return;
  }

  var rawTitle = item.snippet.title;
  var title = rawTitle
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

  // ШАГ B: Проверка на принудительное включение
  var isForcedInclude = FORCED_INCLUDE_IDS.indexOf(videoId) !== -1;

  // Если ролик не в списке принудительных, проверяем его по обычным стоп-словам
  if (!isForcedInclude) {
    if (EXCLUDE_REGEX.test(title)) return;
  }

  var hasCarpetman = carpetPattern.test(title);
  var hasBlackSoil = blackSoilPattern.test(title);

  // ШАГ C: Если ролик в списке для исправления дуэта — форсируем обоих артистов
  if (FORCED_DUO_VIDEO_IDS.indexOf(videoId) !== -1) {
    hasCarpetman = true;
    hasBlackSoil = true;
  }
  
  // ШАГ D (новый): Если ролик в списке "Только Black Soil" — убираем Carpetman, оставляем Black Soil
  if (FORCED_ONLY_BLACK_SOIL_IDS.indexOf(videoId) !== -1) {
    hasCarpetman = false;
    hasBlackSoil = true;
  }
  
  // ШАГ E: Итоговое добавление в кандидаты
  if (hasCarpetman || hasBlackSoil || isForcedInclude) {
    candidateVideos.push({
      id: videoId,
      title: title,
      pubDate: new Date(item.snippet.publishedAt),
      hasCarpetman: hasCarpetman,
      hasBlackSoil: hasBlackSoil
    });
  }
});

      if (candidateVideos.length === 0) {
        sheet.getRange(currentRow, 8, 1, 4).setValues([[0, 0, "", ""]]);
        props.setProperty('LAST_PROCESSED_ROW', (currentRow + 1).toString());
        continue;
      }

      // Запрос длительности и просмотров
      var candidateIds = candidateVideos.map(function(v) { return v.id; });
      var videoDetailsMap = {};

      for (var j = 0; j < candidateIds.length; j += 50) {
        var chunk = candidateIds.slice(j, j + 50);
        var detailsResponse = YouTube.Videos.list('contentDetails,statistics', {
          id: chunk.join(',')
        });

        if (detailsResponse && detailsResponse.items) {
          detailsResponse.items.forEach(function(video) {
            videoDetailsMap[video.id] = {
              duration: parseISO8601Duration(video.contentDetails ? video.contentDetails.duration : null),
              views: parseInt(video.statistics ? video.statistics.viewCount || 0 : 0, 10)
            };
          });
        }
      }

      var validReactionsCount = 0;
      var totalViews = 0;
      var matchedKeywords = new Set();
      var lastReactionDate = null;

      candidateVideos.forEach(function(v) {
        var details = videoDetailsMap[v.id];
        if (!details || details.duration < MIN_DURATION_SECONDS) return;

        validReactionsCount++;
        totalViews += details.views;

        if (v.hasCarpetman && v.hasBlackSoil) {
          matchedKeywords.add("Carpetman x Black Soil");
        } else if (v.hasCarpetman) {
          matchedKeywords.add("Carpetman");
        } else if (v.hasBlackSoil) {
          matchedKeywords.add("Black Soil");
        }

        if (!lastReactionDate || v.pubDate > lastReactionDate) {
          lastReactionDate = v.pubDate;
        }
      });

      var reactionsListArray = Array.from(matchedKeywords);
      var customOrder = ["Carpetman", "Black Soil", "Carpetman x Black Soil"];
      reactionsListArray.sort(function(a, b) {
        return customOrder.indexOf(a) - customOrder.indexOf(b);
      });

      var reactionsListString = reactionsListArray.join(", ");
      var formattedDate = lastReactionDate ? Utilities.formatDate(lastReactionDate, Session.getScriptTimeZone(), "yyyy-MM-dd") : "";

      // Записываем H (Total_Views), I (Reactions), J (Last_Date), K (List)
      sheet.getRange(currentRow, 8).setValue(totalViews);
      sheet.getRange(currentRow, 9).setValue(validReactionsCount);
      sheet.getRange(currentRow, 10).setValue(formattedDate);
      sheet.getRange(currentRow, 11).setValue(reactionsListString);
      
// Ищем первое полноценное видео, которое уже вышло (дата <= сейчас)
    var lastSongName = "";
    var now = new Date().getTime(); // Текущий момент времени

    if (candidateVideos && candidateVideos.length > 0) {
      // Сортируем от самых свежих к старым
      candidateVideos.sort(function(a, b) {
        return new Date(b.pubDate) - new Date(a.pubDate);
      });

      for (var k = 0; k < candidateVideos.length; k++) {
        var video = candidateVideos[k];
        var pubTime = new Date(video.pubDate).getTime();

        // 🛑 ПРОПУСКАЕМ БУДУЩИЕ ПРЕМЬЕРЫ (если дата видео позже текущего времени)
        if (pubTime > now) {
          continue; 
        }

        var detected = detectSongName(video.title);
        if (detected) {
          lastSongName = detected;
          break; // Нашли самый свежий вышедший трек — останавливаемся
        }
      }
    }

    // 🛡️ ЗАЩИТА РУЧНЫХ ЗАПИСЕЙ:
    // Если скрипт ничего не нашел автоматически, но в ячейке уже что-то вписано вручную — оставляем это значение!
    var cellRange = sheet.getRange(currentRow, 24); // Столбец X (24-й)
    var currentManualValue = cellRange.getValue();

    if (lastSongName) {
      cellRange.setValue(lastSongName); // Записываем свежий авто-трек
    } else if (!currentManualValue) {
      cellRange.setValue(""); // Если пусто и авто не нашло — оставляем пусто
    }
    // Если lastSongName пустой, а в currentManualValue что-то есть — скрипт просто ПРОХОДИТ МИМО и не трогает вашу ручную запись!
    
      props.setProperty('LAST_PROCESSED_ROW', (currentRow + 1).toString());
      Logger.log("✅ Строка " + currentRow + " (" + channelUrl + "): " + validReactionsCount + " реакций | Записано.");
    }

    props.setProperty('LAST_PROCESSED_ROW', '2');
    Logger.log("🎉 Обработка всей таблицы завершена!");
  } finally {
    lock.releaseLock();
  }
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

function getChannelDetails(channelId) {
  try {
    var response = YouTube.Channels.list('snippet,statistics', { id: channelId });
    if (response.items && response.items.length > 0) {
      var item = response.items[0];
      var country = item.snippet.country || '';
      
      // Запрашиваем стандартный URL и жестко преобразуем размер в качественный s800
      var rawAvatar = item.snippet.thumbnails && item.snippet.thumbnails.default ? item.snippet.thumbnails.default.url : '';
      var avatarS800 = rawAvatar.replace(/=s\d+-[c-z0-9-]+/, '=s800-c-k-c0x00ffffff-no-rj');

      return {
        subscriberCount: parseInt(item.statistics.subscriberCount || 0, 10),
        avatarUrl: avatarS800,
        countryCode: country.toUpperCase() // Двухбуквенный код страны (US, MX, ZA)
      };
    }
  } catch (e) {
    Logger.log("Ошибка getChannelDetails: " + e.message);
  }
  return null;
}

function parseISO8601Duration(duration) {
  if (!duration) return 0;
  var match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  var hours = parseInt(match[1] || 0, 10);
  var minutes = parseInt(match[2] || 0, 10);
  var seconds = parseInt(match[3] || 0, 10);
  return hours * 3600 + minutes * 60 + seconds;
}

function extractChannelId(url) {
  var match = url.match(/youtube\.com\/(channel\/|c\/|user\/|@)?([^\/\?]+)/);
  if (match) {
    if (url.includes('/channel/')) return match[2];
    if (url.includes('/@')) return '@' + match[2];
    return match[2];
  }
  return null;
}

function getChannelIdByHandle(handle) {
  try {
    var response = YouTube.Channels.list('id', { forHandle: handle });
    if (response.items && response.items.length > 0) return response.items[0].id;
  } catch (e) {
    Logger.log("Ошибка getChannelIdByHandle: " + e.message);
  }
  return null;
}
