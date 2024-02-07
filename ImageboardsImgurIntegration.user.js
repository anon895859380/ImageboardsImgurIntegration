// ==UserScript==
// @name         Imageboards Imgur Integration
// @namespace    ImageboardsImgurIntegration
// @version      1.0
// @description  Imageboards Imgur Integration
// @author       You
// @match        *://bitardchan.rf.gd/*
// @icon         https://s.imgur.com/images/favicon-152.png
// @updateURL    https://github.com/anon895859380/ImageboardsImgurIntegration/raw/main/ImageboardsImgurIntegration.user.js
// @downloadURL  https://github.com/anon895859380/ImageboardsImgurIntegration/raw/main/ImageboardsImgurIntegration.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==

const scriptPrefix = 'iii-';

const elements = {};

const attachmentOpen = "[img]";
const attachmentClose = "[/img]";
const attachmentUrlRegex = /https:\/\/i\.imgur\.com\/\w+\.(jpe?g|a?png|gif|tiff?|bmp|xcf|webp|mp4|mov|avi|webm|mpeg|flv|mkv|mpv|wmv)/;
const attachmentDetectionRegex = new RegExp(escapeRegExp(attachmentOpen) + attachmentUrlRegex.source + escapeRegExp(attachmentClose));

const imageAttachments = ['jpg', 'jpeg', 'png', 'gif', 'apng', 'tiff', 'tif', 'bmp', 'xcf', 'webp'];
const videoAttachments = ['mp4', 'mov', 'avi', 'webm', 'mpeg', 'flv', 'mkv', 'mpv', 'wmv'];

const config = loadConfig();

let dollchanInstalled;
let boards;
let board;

function main() {
    initConstants();

    if (!board) return;

    initConfig();
    initUploadLink();
    initAttachments();
}

function initConstants() {
    dollchanInstalled = document.body.classList.contains('de-runned');

    boards = {
        'bitardchan.rf.gd': {
            threadElement: dollchanInstalled ? 'div[de-thread]' : 'div.posts',
            postElement: 'div.message',
            url: 'a[href]',
            uploadLinkContainer: 'table.postform',
        },
    };

    board = boards[window.location.hostname];
}

function initConfig() {
    addElements(createElement(`<div id='iii-configButton'/>`));
    addElements(createElement(configElementHtml));

    elements.configButton.onclick = () => (elements.configWrapper.style.display = elements.configWrapper.style.display ? '' : 'none');

    elements.maxAttachmentCount.value = config.maxAttachmentCount;
    elements.maxAttachmentCount.onchange = () => { config.maxAttachmentCount = elements.maxAttachmentCount.value; saveConfig(); };

    elements.attachmentWidth.value = config.attachmentWidth;
    elements.attachmentWidth.onchange = () => { config.attachmentWidth = elements.attachmentWidth.value; saveConfig(); };

    elements.openAttachmentsByDefault.checked = config.openAttachmentsByDefault;
    elements.openAttachmentsByDefault.onchange = () => { config.openAttachmentsByDefault = elements.openAttachmentsByDefault.checked; saveConfig(); };

    elements.preloadVideos.checked = config.preloadVideos;
    elements.preloadVideos.onchange = () => { config.preloadVideos = elements.preloadVideos.checked; saveConfig(); };

    document.body.appendChild(elements.configButton);
    document.body.appendChild(elements.configWrapper);
}

function initUploadLink() {
    const container = document.querySelector(board.uploadLinkContainer);
    if (container) container.appendChild(createElement(`<a class='iii-imgur-upload' href='https://imgur.com/upload' target='_blank'>Загрузить медиа в Imgur</a>`));
}

function initAttachments() {
    const thread = document.querySelector(board.threadElement);
    if (thread) registerObserver(thread, board.postElement, i => i.forEach(loadAttachments));
    const posts = document.querySelectorAll(board.postElement);
    posts.forEach(loadAttachments);
}

function loadConfig() {
    return GM_getValue('config') || {
        maxAttachmentCount: 10,
        openAttachmentsByDefault: true,
        preloadVideos: true,
        attachmentWidth: 300,
    };
}

function saveConfig() {
    GM_setValue('config', config);
}

function loadAttachments(post) {
    if (!attachmentDetectionRegex.test(post.textContent)) return;

    const urls = Array.from(post.querySelectorAll(board.url))
        .filter(i =>
            attachmentUrlRegex.exec(i.href)[0].length == i.href.length &&
            i.previousSibling && i.nextSibling &&
            i.previousSibling.textContent.endsWith(attachmentOpen) &&
            i.nextSibling.textContent.startsWith(attachmentClose)
        )
        .slice(0, config.maxAttachmentCount);
    urls.forEach(loadAttachment);
}

function loadAttachment(element) {
    const url = element.href;
    const extension = url.split('.').pop();

    element.previousSibling.textContent = element.previousSibling.textContent.substring(0, element.previousSibling.textContent.length - attachmentOpen.length);
    element.nextSibling.textContent = element.nextSibling.textContent.substring(attachmentClose.length);

    if (!element.previousSibling.textContent.endsWith('\n')) insertBefore(document.createElement('br'), element);
    if (!element.nextSibling.textContent.startsWith('\n')) insertAfter(document.createElement('br'), element);

    const attachmentHeader = document.createElement('a');
    attachmentHeader.textContent = '[Imgur вложение (' + extension + ')]';
    attachmentHeader.classList.add('iii-attachment');

    const attachmentContent = document.createElement('div');
    attachmentContent.classList.add('iii-attachment-content');

    attachmentHeader.onclick = () => (attachmentContent.style.display = attachmentContent.style.display ? '' : 'none');

    if (imageAttachments.includes(extension)) {
        const img = document.createElement('img');
        img.src = url;
        img.width = config.attachmentWidth;
        attachmentContent.appendChild(img);
    }
    else if (videoAttachments.includes(extension)) {
        const video = createElement(`<video controls loop/>`);
        video.width = config.attachmentWidth;
        if (!config.preloadVideos) video.preload = 'none';
        const source = document.createElement('source');
        source.src = url;
        source.type = 'video/' + extension;
        video.appendChild(source);
        attachmentContent.appendChild(video);
    }
    else {
        attachmentContent.appendChild(element.clone(true));
    }

    element.replaceWith(attachmentHeader);
    insertAfter(attachmentContent, attachmentHeader);

    if (!config.openAttachmentsByDefault) attachmentContent.style.display = 'none';
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

function registerObserver(element, query, callback) {
    new MutationObserver((l, o) => {
        let nodes = new Set();

        for (const record of l) for (const node of record.addedNodes) for (const subnode of element.querySelectorAll(query)) nodes.add(subnode);

        if (nodes.size) callback(Array.from(nodes));
    }).observe(element, { childList: true });
}

function createElement(html) {
    const container = document.createElement('div');
    container.innerHTML = html.trim();
    return container.childNodes[0];
}

function addElements(e) {
    addElement(e);
    if (e && e.querySelectorAll) e.querySelectorAll('*[id]').forEach(addElement);
}

function addElement(e) {
    if (e && e.id) elements[e.id.startsWith(scriptPrefix) ? e.id.substring(scriptPrefix.length) : e.id] = e;
}

const configElementHtml = `
<div id='iii-configWrapper' style='display: none;'>
    <div id='iii-config'>
        <label>Максимальное кол-во вложений <input id='iii-maxAttachmentCount' class='iii-small-input' type='number'/></label>
        <label>Ширина вложения <input id='iii-attachmentWidth' class='iii-small-input' type='number'/></label>
        <label>Раскрывать вложения <input id='iii-openAttachmentsByDefault' type='checkbox'/></label>
        <label>Предзагрузка видео <input id='iii-preloadVideos' type='checkbox'/></label>
    </div>
</div>`;

GM_addStyle(`
.iii-attachment {
 user-select: none;
}

.iii-attachment-content > * {
 border: 1px solid #0004;
}

.iii-small-input {
 width: 50px;
}

.iii-imgur-upload {
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

setTimeout(main, 500);
