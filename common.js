'use strict';

const CODE_SEARCH = {
  CHROMIUM: 'https://cs.chromium.org/search/?q=%s&sq=package:chromium&type=cs',
  CHROMIUM_OS: 'https://github.com/mgiuffrida/chromiumos-platform2/search?utf8=%E2%9C%93&q=%s',
};

const MENU_ITEMS = {
  AUTO: 'auto',
  BUG: 'bug',
  CODE_SEARCH: 'codeSearch',
  CODE_SEARCH_CHROMIUM: 'codeSearchChromium',
  CODE_SEARCH_CHROMIUM_OS: 'codeSearchChromiumOS',
  REVISION: 'revision',
};

const defaultConfig =  {
  lookupTypes: {
    CRBUG: true,
    CRREV: true,
    CODESEARCH: CODE_SEARCH.CHROMIUM,
  },
  manualMode: false,
};
