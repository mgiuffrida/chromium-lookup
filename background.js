'use strict';

let config;

function getMenuItemUrlForText(menuItemId, text) {
  switch (menuItemId) {
    case MENU_ITEMS.BUG:
      return maybeGetCrBug(text) || getCrBugSearch(text);
    case MENU_ITEMS.CODE_SEARCH:
      return getCodeSearch(config.lookupTypes.CODESEARCH, text);
    case MENU_ITEMS.CODE_SEARCH_CHROMIUM:
      return getCodeSearch(CODE_SEARCH.CHROMIUM, text);
    case MENU_ITEMS.CODE_SEARCH_CHROMIUM_OS:
      return getCodeSearch(CODE_SEARCH.CHROMIUM_OS, text);
    case MENU_ITEMS.REVISION:
      return maybeGetCrRev(text) || maybeGetOwnerCodeReviews(text) ||
          getRev(text);
    case MENU_ITEMS.AUTO:
      let url;
      if (config.lookupTypes.CRBUG)
        url = maybeGetCrBug(text);
      if (!url && config.lookupTypes.CRREV)
        url = maybeGetCrRev(text);
      // Fall back to code search.
      if (!url)
        url = getCodeSearch(config.lookupTypes.CODESEARCH, text);
      return url;
    default:
      throw 'Invalid menu item ID: ' + menuItemId;
  }
}

function onItemClick(info, tab) {
  // This can be called before the extension is actually activated; apparently
  // Chrome "caches" extension-created context menu items, so this function can
  // be called almost immediately after loading.
  if (!config) {
    // Wait for storage to load.
    setTimeout(onItemClick.bind(null, info, tab));
    return;
  }

  let text = info.selectionText.trim();
  let url;

  url = getMenuItemUrlForText(info.menuItemId, text);
  if (url)
    chrome.tabs.create({url: url});
}

function maybeGetCrBug(text) {
  let matches =
      text.match(new RegExp(
          '^' +
          '(?:' +
            'issue ?|issue ?#|#|cr:|cr/|crbug:|crbug/|crbug.com/' +
          ')?' +
          '(\\d{3,6})' +
          '(#\\d*)?' +
          '$',
          'i'));
  if (!matches)
    return false;
  let url = 'https://crbug.com/' + matches[1];
  if (matches[2])  // comment hash
    url += matches[2];
  return url;
}

function getCrBugSearch(text) {
  return 'https://bugs.chromium.org/p/chromium/issues/list?q=' +
      encodeURIComponent(text);
}

function maybeGetCrRev(text) {
  // Find obvious matches.
  let matches =
      text.match(new RegExp(
          '^' +
          '(?:' +
            'crrev\.com/|crrev\.com:|crrev/|crrev:' +
          ')' +
          '((?:[ci]/)?\\d*)' +
          '((?:/|#).*)?' +
          '$',
          'i'));
  if (!matches) {
    matches =
        text.match(new RegExp(
            '^' +
            '([ci]/\\d*)' +
            '((?:/|#).*)?' +
            '$',
            'i'));
  }
  // Heuristic matches.
  if (!matches) {
    matches =
        text.match(new RegExp(
            '^' +
            '(?:' +
              'issue ?|issue ?#|#' +
            ')?' +
            '(\\d{4,10})' +
            '((?:/|#).*)?' +
            '$',
            'i'));
  }
  // Revisions.
  if (!matches) {
    matches =
        text.match(new RegExp(
            '^' +
            '([0-9a-f]{6,40})' +
            '$',
            'i'));
  }
  if (!matches)
    return false;

  let url = 'https://crrev.com/' + matches[1];
  if (matches[2])
    url += matches[2];
  return url;
}

function maybeGetOwnerCodeReviews(text) {
  // Look for some semblance of a username/email, but not a hexadecimal number.
  if (text.search(/[g-z@.]/i) == -1)
    return false;

  // Do an owner search, for lack of a better option.
  return 'https://chromium-review.googlesource.com/q/' +
      encodeURIComponent('owner:' + text);
}

function getRev(text) {
  return 'https://crrev.com/' + encodeURIComponent(text);
}

function getCodeSearch(searchUrl, text) {
  let query = text.replace(/"/g, '\\"');
  if (searchUrl == CODE_SEARCH.CHROMIUM)
    query = '"' + query + '"';

  return searchUrl.replace('%s', encodeURIComponent(query));
}

chrome.contextMenus.onClicked.addListener(onItemClick);


function addContextMenus() {
  chrome.contextMenus.removeAll(onContextMenusRemoved);
}

function onContextMenusRemoved() {
  if (!config.manualMode) {
    chrome.contextMenus.create({
      id: MENU_ITEMS.AUTO,
      title: 'Chromium Lookup: "%s"',
      contexts: ['selection'],
    });
    return;
  }

  let codeSearchId;
  let title;
  // TODO: Make the presets actual settings, instead of tying them to a
  // specific URL.
  switch (config.lookupTypes.CODESEARCH) {
    case CODE_SEARCH.CHROMIUM:
      codeSearchId = MENU_ITEMS.CODE_SEARCH_CHROMIUM;
      title = 'Code search';
      break;
    case CODE_SEARCH.CHROMIUM_OS:
      codeSearchId = MENU_ITEMS.CODE_SEARCH_CHROMIUM_OS;
      title = 'Chromium OS code search';
      break;
    default:
      codeSearchId = MENU_ITEMS.CODE_SEARCH;
      title = 'Custom search';
      break;
  }
  chrome.contextMenus.create({
    id: codeSearchId,
    title: title,
    contexts: ['selection'],
  });

  if (config.lookupTypes.CRBUG) {
    chrome.contextMenus.create({
      id: MENU_ITEMS.BUG,
      title: 'Bug search',
      contexts: ['selection'],
    });
  }

  if (config.lookupTypes.CRREV) {
    chrome.contextMenus.create({
      id: MENU_ITEMS.REVISION,
      title: 'Revision/CL',
      contexts: ['selection'],
    });
  }
}

function reset() {
  chrome.storage.sync.get(defaultConfig, function(loadedConfig) {
    config = loadedConfig;
    addContextMenus();
  });
}

chrome.storage.onChanged.addListener(reset);

reset();
