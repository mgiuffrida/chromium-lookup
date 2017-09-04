'use strict';

let $ = id => document.getElementById(id);

let curConfig = null;

function deepEquals(lhs, rhs) {
  if (typeof lhs != 'object' || typeof rhs != 'object')
    return lhs == rhs;
  let lhsProps = Object.getOwnPropertyNames(lhs).sort();
  let rhsProps = Object.getOwnPropertyNames(rhs).sort();
  if (lhsProps.length != rhsProps.length)
    return false;
  for (let i = 0; i < lhsProps.length; i++) {
    let prop = lhsProps[i];
    if (rhsProps[i] != prop)
      return false;
    if (!deepEquals(lhs[prop], rhs[prop]))
      return false;
  }
  return true;
}

function loadOptions() {
  chrome.storage.sync.get(defaultConfig, function(config) {
    $('sourceCrBug').checked = config.lookupTypes.CRBUG;
    $('sourceCrRev').checked = config.lookupTypes.CRREV;

    if (config.lookupTypes.CODESEARCH == CODE_SEARCH.CHROMIUM) {
      $('codeSearchSite').value = 'chromium';
    } else if (config.lookupTypes.CODESEARCH == CODE_SEARCH.CHROMIUM_OS) {
      $('codeSearchSite').value = 'chromium-os';
    } else {
      $('codeSearchSite').value = 'custom';
      $('codeSearchCustomUrl').value = config.lookupTypes.CODESEARCH;
    }

    $('manualMode').checked = config.manualMode;

    curConfig = config;

    onOptionsChanged();
  });
}

function isValidSearchUrl(s) {
  var url;
  try {
    url = new URL(s);
    return url.href.includes('%s');
  } catch (e) {
    return false;
  }
}

function onOptionsChanged() {
  if (debouncer) {
    clearTimeout(debouncer);
    debouncer = null;
  }

  if (!curConfig) {
    debouncer = setTimeout(onOptionsChanged, 100);
    return;
  }

  let codeSearchSite = $('codeSearchSite').value;
  $('codeSearchCustom').hidden = codeSearchSite != 'custom';

  let config = {
    lookupTypes: {},
  };

  if (codeSearchSite == 'chromium') {
    config.lookupTypes.CODESEARCH = CODE_SEARCH.CHROMIUM;
  } else if (codeSearchSite == 'chromium-os') {
    config.lookupTypes.CODESEARCH = CODE_SEARCH.CHROMIUM_OS;
  } else {
    let customUrlValue = $('codeSearchCustomUrl').value;
    if (!isValidSearchUrl(customUrlValue))
      customUrlValue = 'http://' + customUrlValue;
    if (isValidSearchUrl(customUrlValue))
      config.lookupTypes.CODESEARCH = customUrlValue;
    else
      config.lookupTypes.CODESEARCH = curConfig.lookupTypes.CODESEARCH;
  }

  config.lookupTypes.CRBUG = $('sourceCrBug').checked;
  config.lookupTypes.CRREV = $('sourceCrRev').checked;
  config.manualMode = $('manualMode').checked;

  if (deepEquals(config, curConfig))
    return;
  curConfig = config;
  chrome.storage.sync.set(config, function() {
    showSaved();
  });
}

function showSaved() {
  $('status').classList.add('showing');
  setTimeout(() => {
    requestAnimationFrame(() => {
      $('status').classList.remove('showing');
    });
  }, 100);
}

let debouncer;
function onChange(e) {
  let el = e.target;
  if (el.tagName == 'INPUT' && el.type == 'text') {
    if (debouncer)
      clearTimeout(debouncer);
    debouncer = setTimeout(onOptionsChanged, 500);
    return;
  }

  onOptionsChanged();
}

function init() {
  loadOptions();
  for (let el of document.body.querySelectorAll('input, select')) {
    el.addEventListener('change', onChange);
    if (el.tagName == 'INPUT' && el.type == 'text')
      el.addEventListener('keydown', onChange);
  }
}

document.addEventListener('DOMContentLoaded', init);
