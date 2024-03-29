// ==UserScript==
// @name         Imageboards Imgur Integration
// @namespace    ImageboardsImgurIntegration
// @version      1.6
// @description  Imageboards Imgur Integration
// @author       You
// @match        *://bitardchan.rf.gd/*
// @icon         https://s.imgur.com/images/favicon-152.png
// @updateURL    https://github.com/anon895859380/ImageboardsImgurIntegration/raw/main/ImageboardsImgurIntegration.user.js
// @downloadURL  https://github.com/anon895859380/ImageboardsImgurIntegration/raw/main/ImageboardsImgurIntegration.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      cdn.imgchest.com
// @connect      i.imgur.com
// ==/UserScript==

const scriptPrefix = 'iii-';

const elements = {};

const tagsRemovingRegexes = {
    begin: /\[img\]$/,
    end: /^\[\/img\]/
};
const attachmentUrlRegex = /^https:\/\/(cdn\.imgchest\.com\/files|i\.imgur\.com)\/\w+\.(jpe?g|a?png|gif|tiff?|bmp|xcf|webp|mp4|mov|avi|webm|mpeg|flv|mkv|mpv|wmv)($|(?=\[\/img\]$))/i;

const imageAttachments = ['jpg', 'jpeg', 'png', 'gif', 'apng', 'tiff', 'tif', 'bmp', 'xcf', 'webp'];
const videoAttachments = ['mp4', 'mov', 'avi', 'webm', 'mpeg', 'flv', 'mkv', 'mpv', 'wmv'];
const uploadUrls = {'Image chest': 'https://imgchest.com/upload', 'Imgur': 'https://imgur.com/upload'};

const config = loadConfig();

let pageInfo;
let boards;
let board;

function main() {
    initConstants();

    if (!board) return;

    initConfig();
    initUploadLinks();
    initAttachments();
}

function initConstants() {
    pageInfo = {
        dollchanInstalled: document.body.classList.contains('de-runned'),
    };
    boards = {
        'bitardchan.rf.gd': {
            autoupdateElements: 'form#delform',
            postElement: 'div.message',
            url: 'a[href]',
            uploadLinkContainer: 'table.postform',
            boardRegex: /^\/\w+\/(\?.*|#.*)?$/,
            threadRegex: /^\/\w+\/res\/\d+\.html(\?.*|#.*)?$/i,
        },
    };

    board = boards[window.location.hostname];

    if (board) { Object.assign(pageInfo, {
        isBoard: board.boardRegex.test(window.location.pathname),
        isThread: board.threadRegex.test(window.location.pathname),
    });}
}

function initConfig() {
    addElements(createElement(`<div id='iii-configButton'/>`));
    addElements(createElement(configElementHtml));

    elements.configButton.onclick = () => (elements.configWrapper.style.display = elements.configWrapper.style.display ? '' : 'none');

    elements.maxAttachmentCount.value = config.maxAttachmentCount;
    elements.maxAttachmentCount.onchange = () => { config.maxAttachmentCount = elements.maxAttachmentCount.value; saveConfig(); };

    elements.attachmentWidth.value = config.attachmentWidth;
    elements.attachmentWidth.onchange = () => { config.attachmentWidth = elements.attachmentWidth.value; saveConfig(); };

    elements.attachmentHeight.value = config.attachmentHeight;
    elements.attachmentHeight.onchange = () => { config.attachmentHeight = elements.attachmentHeight.value; saveConfig(); };

    elements.openAttachmentsByDefaultThread.checked = config.openAttachmentsByDefaultThread;
    elements.openAttachmentsByDefaultThread.onchange = () => { config.openAttachmentsByDefaultThread = elements.openAttachmentsByDefaultThread.checked; saveConfig(); };

    elements.openAttachmentsByDefaultBoard.checked = config.openAttachmentsByDefaultBoard;
    elements.openAttachmentsByDefaultBoard.onchange = () => { config.openAttachmentsByDefaultBoard = elements.openAttachmentsByDefaultBoard.checked; saveConfig(); };

    elements.preloadVideos.checked = config.preloadVideos;
    elements.preloadVideos.onchange = () => { config.preloadVideos = elements.preloadVideos.checked; saveConfig(); };

    document.body.appendChild(elements.configButton);
    document.body.appendChild(elements.configWrapper);
}

function initUploadLinks() {
    const container = document.querySelector(board.uploadLinkContainer);
    if (container) Object.keys(uploadUrls).map(i => createElement(`<a class='iii-upload-url' target='_blank'/>`, {textContent: '[' + i + '] ', href: uploadUrls[i]})).forEach(i => container.appendChild(i));
}

function initAttachments() {
    const autoupdates = document.querySelectorAll(board.autoupdateElements);
    if (autoupdates.length) registerObservers(autoupdates, board.postElement, i => i.forEach(loadAttachments));
    const posts = document.querySelectorAll(board.postElement);
    posts.forEach(loadAttachments);
}

function loadConfig() {
    let cfg = GM_getValue('config') || {};

    cfg.maxAttachmentCount ??= 10;
    cfg.openAttachmentsByDefaultBoard ??= false;
    cfg.openAttachmentsByDefaultThread ??= true;
    cfg.preloadVideos ??= true;
    cfg.attachmentWidth ??= 450;
    cfg.attachmentHeight ??= 300;

    return cfg;
}

function saveConfig() {
    GM_setValue('config', config);
}

function loadAttachments(post) {
    const urls = Array.from(post.querySelectorAll(board.url))
        .map(e => ({element: e, url: match(e.href, attachmentUrlRegex)}))
        .filter(a => a.url)
        .slice(0, config.maxAttachmentCount);
    urls.forEach(loadAttachment);
}

function loadAttachment(attachment) {
    const element = attachment.element;
    const url = attachment.url;
    const extension = url.split('.').pop();

    element.previousSibling.textContent = element.previousSibling.textContent.replace(tagsRemovingRegexes.begin, '').trimEnd();
    element.nextSibling.textContent = element.nextSibling.textContent.replace(tagsRemovingRegexes.end, '').trimStart();

    if (element.previousSibling.nodeType == Node.TEXT_NODE && !element.previousSibling.textContent) element.previousSibling.remove();
    if (element.nextSibling.nodeType == Node.TEXT_NODE && !element.nextSibling.textContent) element.nextSibling.remove();

    /*element.previousSibling.textContent = element.previousSibling.textContent.substring(0, element.previousSibling.textContent.length - attachmentOpen.length);
    element.nextSibling.textContent = element.nextSibling.textContent.substring(attachmentClose.length);*/

    if (element.previousSibling && element.previousSibling.tagName != 'BR') insertBefore(document.createElement('br'), element);
    if (element.nextSibling && element.nextSibling.tagName != 'BR') insertAfter(document.createElement('br'), element);

    const attachmentHeader = createElement(`<div class='iii-attachment'/>`, null, [
        createElement(`<a/>`, {textContent: '[Вложение (' + extension + ')]', onclick: () => (attachmentContent.style.display = attachmentContent.style.display ? '' : 'none')}),
        createElement(`<a/>`, {textContent: ' [L]', title: 'Скопировать ссылку', onclick: () => copy(url)}),
        createElement(`<a/>`, {textContent: ' [D]', title: 'Скачать', onclick: e => processAttachmentDownload(url, e.originalTarget)}),
    ]);

    const attachmentContent = createElement(`<div class='iii-attachment-content'/>`);

    if (imageAttachments.includes(extension)) {
        const img = createElement(`<img/>`, {src: url});
        attachmentContent.appendChild(img);
    }
    else if (videoAttachments.includes(extension)) {
        const video = createElement(`<video controls loop/>`, null, [createElement(`<source/>`, {src: url, type: 'video/' + extension})]);
        if (!config.preloadVideos) video.preload = 'none';
        attachmentContent.appendChild(video);
    }
    else {
        attachmentContent.appendChild(element.clone(true));
    }

    element.replaceWith(attachmentHeader);
    insertAfter(attachmentContent, attachmentHeader);

    if (!(pageInfo.isBoard && config.openAttachmentsByDefaultBoard ||
          pageInfo.isThread && config.openAttachmentsByDefaultThread)) attachmentContent.style.display = 'none';
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling)
}

function insertBefore(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode);
}

function registerObservers(elements, query, callback) {
    const observer = new MutationObserver((l, o) => {
        let nodes = new Set();

        for (const record of l) for (const node of record.addedNodes) for (const subnode of (node.parentNode ? node.parentNode : node).querySelectorAll(query)) nodes.add(subnode);

        if (nodes.size) callback(Array.from(nodes));
    });
    elements.forEach(i => observer.observe(i, { childList: true, subtree: true }));
}

function createElement(html, safeAssign, children) {
    const container = document.createElement('div');
    container.innerHTML = html.trim();
    const element = container.childNodes[0];
    if (safeAssign) Object.assign(element, safeAssign);
    if (children) children.forEach(i => element.appendChild(i));
    return element;
}

function addElements(e) {
    addElement(e);
    if (e && e.querySelectorAll) e.querySelectorAll('*[id]').forEach(addElement);
}

function addElement(e) {
    if (e && e.id) elements[e.id.startsWith(scriptPrefix) ? e.id.substring(scriptPrefix.length) : e.id] = e;
}

function copy(text) {
    navigator.clipboard.writeText(text).then(null, err => alert('Ошибка копирования: ' + err));
}

function match(str, regex) {
    const match = regex.exec(str);
    return match ? match[0] : null;
}

function processAttachmentDownload(url, element) {
    const prevOnclick = element.onclick;
    const prevTextContent = element.textContent;

    const resetElement = () => {
        element.onclick = prevOnclick;
        element.textContent = prevTextContent;
    };

    element.onclick = null;
    element.textContent = ' [Загрузка...]'

    GM_xmlhttpRequest({
        url: url,
        anonymous: true,
        responseType: 'blob',
        onload: r => {
            resetElement();
            saveResponse(r, url.split('/').pop());
        },
        onerror: r => {
            resetElement();
            alert('Ошибка загрузки');
        },
        onabort: resetElement,
    });
}

function saveResponse(res, name) {
    if (res.status !== 200) return;
    const blob = new Blob([res.response], {type: res.response.type});
    const url = URL.createObjectURL(blob);
    const a = createElement(`<a/>`, {href: url, target: '_blank', download: name});
    a.click();
}

const configElementHtml = `
<div id='iii-configWrapper' style='display: none;'>
    <div id='iii-config'>
        <label>Максимальное кол-во вложений <input id='iii-maxAttachmentCount' class='iii-small-input' type='number'/></label>
        <label>Ширина вложения <input id='iii-attachmentWidth' class='iii-small-input' type='number'/></label>
        <label>Высота вложения <input id='iii-attachmentHeight' class='iii-small-input' type='number'/></label>
        <label>Раскрывать вложения на досках <input id='iii-openAttachmentsByDefaultBoard' type='checkbox'/></label>
        <label>Раскрывать вложения в тредах <input id='iii-openAttachmentsByDefaultThread' type='checkbox'/></label>
        <label>Предзагрузка видео <input id='iii-preloadVideos' type='checkbox'/></label>
    </div>
</div>`;

GM_addStyle(`
.iii-attachment {
 user-select: none;
}

.iii-attachment-content > * {
 border: 1px solid #0004;
 max-width: ${parseInt(config.attachmentWidth) ?? 300}px;
 max-height: ${parseInt(config.attachmentHeight) ?? 450}px;
}

.iii-small-input {
 width: 50px;
}

.iii-upload-url {
 font-size: 12px;
}

#iii-configButton {
 position: fixed;
 top: 4px;
 right: 4px;

 width: 16px;
 height: 16px;

 opacity: 25%;
 background: url(https://s.imgur.com/images/favicon-16x16.png) no-repeat center;
}

#iii-configButton:hover {
 opacity: 100%;
}

#iii-config {
 display: flex;
 flex-direction: column;

 position: fixed;
 top: 4px;
 right: 24px;
 padding: 4px;

 background-color: white;
}

#iii-config * {
 color: black;
 user-select: none;
 font-size: 14px;
}

#iii-config > * {
 margin: 2px 0;
}
`);

setTimeout(main, 100);
