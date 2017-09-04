'use strict';

let config;

function onItemClick(info, tab) {
  let text = info.selectionText.trim();
  let url;

  switch (info.menuItemId) {
    case 'auto':
      if (config.lookupTypes.CRBUG)
        url = maybeGetCrBug(text);
      if (!url && config.lookupTypes.CRREV)
        url = maybeGetCrRev(text);
      if (!url)
        url = getCodeSearch(config.lookupTypes.CODESEARCH, text);
      break;
    case 'crbug':
      url = maybeGetCrBug(text) || getCrBugSearch(text);
      break;
    case 'crrev':
      url = maybeGetCrRev(text) || maybeGetOwnerCodeReviews(text) ||
          getRev(text);
      break;
    case 'codeSearchChromium':
      url = getCodeSearch(codeSearchChromium, text);
      break;
    case 'codeSearchChromiumOS':
      url = getCodeSearch(codeSearchChromiumOS, text);
      break;
    case 'codeSearchCustom':
      url = getCodeSearch(config.lookupTypes.CODESEARCH, text);
      break;
  }

  if (url)
    chrome.tabs.create({url: url});
}

function maybeGetCrBug(text) {
  let matches =
      text.match(
          '^' +
          '(?:' +
            'issue ?|issue ?#|#|cr:|cr/|crbug:|crbug/|crbug.com/' +
          ')?' +
          '(\\d{3,6})' +
          '(#\\d*)?' +
          '$');
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
      text.match(
          '^' +
          '(?:' +
            'crrev\.com/|crrev\.com:|crrev/|crrev:' +
          ')' +
          '(\\d*)' +
          '((?:/|#).*)?' +
          '$');
  // Heuristic matches.
  if (!matches) {
    matches =
        text.match(
            '^' +
            '(?:' +
              'issue ?|issue ?#|#' +
            ')?' +
            '(\\d{4,6})' +
            '((?:/|#).*)?' +
            '$');
  }
  // Revisions.
  if (!matches) {
    matches = 
        text.match(
            '^' +
            '([0-9a-fA-F]{6,40})' +
            '$');
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
  return 'https://codereview.chromium.org/search?owner=' +
      encodeURIComponent(text);
}

function getRev(text) {
  return 'https://crrev.com/' + encodeURIComponent(text);
}

function getCodeSearch(searchUrl, text) {
  //let params = new URLSearchParams;

  let query = text.replace(/"/g, '\\"');
  if (searchUrl == codeSearchChromium)
    query = '"' + query + '"';

  return searchUrl.replace('%s', encodeURIComponent(query));
}

chrome.contextMenus.onClicked.addListener(onItemClick);


function addContextMenus() {
  if (!config.manualMode) {
    chrome.contextMenus.create({
      id: 'auto',
      title: 'Chromium Lookup: "%s"',
      contexts: ['selection'],
    });
    return;
  }

  let codeSearchId;
  let title;
  switch (config.lookupTypes.CODESEARCH) {
    case codeSearchChromium:
      codeSearchId = 'codeSearchChromium';
      title = 'Code search';
      break;
    case codeSearchChromiumOS:
      codeSearchId = 'codeSearchChromiumOS';
      title = 'Chromium OS code search';
      break;
    default:
      codeSearchId = 'codeSearchCustom';
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
      id: 'crbug',
      title: 'Bug search',
      contexts: ['selection'],
    });
  }

  if (config.lookupTypes.CRREV) {
    chrome.contextMenus.create({
      id: 'crrev',
      title: 'Revision/CL',
      contexts: ['selection'],
    });
  }
}

function reset() {
  chrome.contextMenus.removeAll(function() {
    chrome.storage.sync.get(defaultConfig, function(loadedConfig) {
      config = loadedConfig;
      addContextMenus();
    });
  });
}

chrome.runtime.onInstalled.addListener(reset);
chrome.storage.onChanged.addListener(reset);
