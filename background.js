// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Called when the user clicks on the browser action.

var urlRegex = /^https?:\/\/(?:[^./?#]+\.)?101weiqi\.com/;


chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const tab = tabs[0];
    if (urlRegex.test(tab.url)) {
      chrome.tabs.sendMessage(tab.id, {text: 'get_g_qq'}, null);
    }
  });
});