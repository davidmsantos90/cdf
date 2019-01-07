var docletUtils = require('../doclet/utils');
var pageUtils = require('./utils');

/* global module */
exports = module.exports = function(view, wrappedDoclet) {
  var kind = 'main';

  var mainPage = pageUtils.Page(view, wrappedDoclet, kind);

  mainPage._renderTopSection = mainPageRender.bind(mainPage);
  mainPage._renderSummarySection = dummy.bind(mainPage);
  mainPage._renderDetailSection = dummy.bind(mainPage);

  return mainPage;
};

var dummy = function() { return ''; };

var mainPageRender = function(wrappedDoclet) {
  var mainPage = '';

  var name = wrappedDoclet.get('name');
  var version = wrappedDoclet.get('version');

  if (wrappedDoclet.isPackage && docletUtils.canWriteValue(name) && docletUtils.canWriteValue(version)) {
    mainPage += pageUtils.h3(function() {
      return name + version;
    });
  }

  var readme = wrappedDoclet.get('readme');
  if (docletUtils.canWriteValue(readme)) {
    mainPage += readme;

    var navigationIndex = wrappedDoclet.get('nav');
    if (docletUtils.canWriteValue(navigationIndex)) {
      mainPage += pageUtils.nav(navigationIndex);
    }
  }

  return mainPage;
};
