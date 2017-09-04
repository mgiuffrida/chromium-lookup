'use strict';

const codeSearchChromium = 'https://cs.chromium.org/search/?q=%s&sq=package:chromium&type=cs';
const codeSearchChromiumOS = 'https://github.com/mgiuffrida/chromiumos-platform2/search?utf8=%E2%9C%93&q=%s';

let defaultConfig =  {
  lookupTypes: {
    CRBUG: true,
    CRREV: true,
    CODESEARCH: codeSearchChromium,
  },
  manualMode: false,
};

