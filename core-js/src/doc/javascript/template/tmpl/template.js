var docletUtils = require('./doclet/utils');
var Page = require('./page/utils').Page;

var MainPage = require('./page/main');
var GenericPage = require('./page/generic');
var GlobalPage = require('./page/global');
var ClassPage = require('./page/class');
var SourcePage = require('./page/source');

exports.render = function(data) {
  var view = this;

  var isGlobalPage;

  // console.log(' > ' + data.title);

  var html = '';
  data.docs.map(function(doclet) {
    return docletUtils.wrap(view, doclet);
  }).forEach(function(wrappedDoclet) {
    // we only need to check this once
    if (isGlobalPage == null) {
      isGlobalPage = wrappedDoclet.isGlobal;
    }

    var page = null;
    if (wrappedDoclet.isMainPage) {
      page = MainPage(view, wrappedDoclet);
    } else if (wrappedDoclet.isSource) {
      page = SourcePage(view, wrappedDoclet);
    } else {

      if (isGlobalPage) {
        page = GlobalPage(view, wrappedDoclet);
      } else if (wrappedDoclet.isClass) {
        page = ClassPage(view, wrappedDoclet);
      } else {
        /* Namespace, Interface, Mixin... maybe also for Module and External */
        page = GenericPage(view, wrappedDoclet);
      }
    }

    if (page != null) {
      html += page.render();
    }
  });

  return Page.applyLayout(data.title, html);
};
