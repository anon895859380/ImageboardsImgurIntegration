# Imageboards Imgur Integration
Интеграция медиа-хостингов для имиджборд.

## Установка
1. Установите расширение [Tampermonkey](https://www.tampermonkey.net/) или [Violentmonkey](https://violentmonkey.github.io/)
2. Установите [скрипт](https://github.com/anon895859380/ImageboardsImgurIntegration/raw/main/ImageboardsImgurIntegration.user.js)

## Использование
1. Нажмите на ссылку на необходимый сервис под формой для постинга.
2. Загрузите медиафайл на сайт.
4. Скопируйте прямую ссылку на файл

     - Image Chest: В правом верхнем углу медиа нажмите на кнопку '▼', 'Get links' и 'Copy' под надписью 'URL'. Скопированный текст должен выглядеть примерно так: `https://cdn.imgchest.com/files/abCd123.mp4`
     - Imgur: В правом верхнем углу медиа нажмите на кнопку '...', 'Get share links' и 'Copy link' под надписью 'BBCode (Forums)'. Скопированный текст должен выглядеть примерно так: `[img]https://i.imgur.com/abCd123.mp4[/img]`
6. Вставьте скопированный текст в форму для постинга

В скрипт встроено автоудаление BBCode тегов для удобства работы с Imgur.

## Настройки
Справа сверху, после установки скрипта, появляется иконка Imgur, при нажатии которой открываются настройки. В них можно изменить: максимальное кол-во вложений, ширину вложения, автоматическое раскрывание вложений и предзагрузку видео.

## Обратная связь
 - [Запросить добавление имиджборды в список поддерживаемых](https://github.com/anon895859380/ImageboardsImgurIntegration/discussions/1)
 - [Скрипт работает с ошибками](https://github.com/anon895859380/ImageboardsImgurIntegration/issues/new)
