// ==UserScript==
// @name         UpdateGithub
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Make long conversions shorter in github pull requests!
// @author       Simon Klein
// @match        https://github.com/**pull/**
// ==/UserScript==

const URLID = document.URL.split("pull/")[1];
const keyCodeF2 = "F2";
const alreadyUsedClass = "better-github-updated";
const storagePrefix = "better-github-" + URLID + "-";
const resolvableClass = "better-github-resolvable";
const hideButtonClass = "better-github-hide-button";
const ignoreButtonClass = "better-github-ignore-button";

document.addEventListener('keydown', function(e) {
    if (e.code == keyCodeF2) {
        apply();
        addStyle();
        addClearButton();
    }
});

function apply(){
    makeElementsHideableByClass('js-resolvable-timeline-thread-container');
    makeElementsHideableByClass('js-timeline-item');
}

function makeElementsHideableByClass(classname){
    let elements = document.getElementsByClassName(classname);
    for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        determinateId(element);
        applyChanges(element);
    }
}

function determinateId(element){
    if (element.id != "") {
        return;
    }

    let gid = element.getAttribute('data-gid');
    if (gid != null) {
      element.id = gid;
    } else {
      element.id = generateHashCode(element.innerHTML)
    }
}

function isIgnoredOrUsed(element){
    return isAlreadyUsed(element) || isIgnored(element);
}

function isAlreadyUsed(element){
    return element.classList.contains(alreadyUsedClass);
}

function markUsed(element){
    element.classList.add(alreadyUsedClass);
}

function isIgnored(element){
    return isStoredTrue("ignore-" + element.id);
}

function isStoredTrue(name){
    if (localStorage.getItem(storagePrefix + name) == "true"){
        return true;
    }

    return false;
}

function storeTrue(name){
    localStorage.setItem(storagePrefix + name, true);
}

function removeStored(name){
    localStorage.removeItem(storagePrefix + name);
}

function shouldBeHidden(element){
    return isStoredTrue("hidden-" + element.id);
}

function hide(element){
    element.hidden = true;
    storeTrue("hidden-" + element.id);
}

function ignore(element){
    storeTrue("ignore-" + element.id);
}

function markResolvable(element) {
    element.classList.add(resolvableClass);
}

function markNotResolvable(element) {
    element.classList.remove(resolvableClass);
}

function clearAllStoredForThisPage(){
    let keys = [];

    for (let i=0; i<=localStorage.length-1; i++)
    {
        let key = localStorage.key(i);
        if (!key.startsWith(storagePrefix)){
            continue;
        }
        keys.push(key);
    }

    for (let key of keys) {
        localStorage.removeItem(key);
    }

    location.reload();
}

function generateHashCode(str){
    var hash = 0, i, chr;
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

function addClearButton(){
    let headline = document.getElementsByClassName("gh-header-show")[0];
    if (isAlreadyUsed(headline)){
        return;
    }
    markUsed(headline);

    let btnClear = document.createElement("Button");
    btnClear.innerText = "Clear"
    btnClear.title = "Remove all stored information for this page."
    btnClear.onclick = function() {
        clearAllStoredForThisPage();
    };

    headline.insertBefore(btnClear, headline.firstChild);
}

function applyChanges(element) {
    if (shouldBeHidden(element)) {
        hide(element);
    }

    if (isIgnoredOrUsed(element)) {
        return;
    }
    markUsed(element);

    let btnIgnore = document.createElement("Button");
    btnIgnore.innerText = "Ignore"
    btnIgnore.title = "Ignore this element. The border and the hide/ignore button are removed."
    btnIgnore.onclick = function() {
        ignore(element);
        markNotResolvable(element);
        let innerHideBtn = element.getElementsByClassName(hideButtonClass)[0];
        let innerIgnoreBtn = element.getElementsByClassName(ignoreButtonClass)[0];
        innerHideBtn.remove();
        innerIgnoreBtn.remove();
    };
    btnIgnore.classList.add(ignoreButtonClass);

    let btnHide = document.createElement("Button");
    btnHide.innerText = "Hide";
    btnHide.title = "Hide this element.";
    btnHide.onclick = function() {
        hide(element)
    };
    btnHide.classList.add(hideButtonClass);

    element.insertBefore(btnIgnore, element.firstChild);
    element.insertBefore(btnHide, element.firstChild);
    markResolvable(element);
}

function addStyle(){
    let head = document.head || document.getElementsByTagName('head')[0];
    if (isAlreadyUsed(head)) {
        return;
    }
    markUsed(head)

    let css = "." + resolvableClass + " { border: 2px solid black; }";
    let style = document.createElement('style');

    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    head.appendChild(style);
}
