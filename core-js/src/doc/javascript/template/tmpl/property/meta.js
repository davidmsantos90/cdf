var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

/*global module */

// from: details.tmpl
var _renderDetails = function(wrappedDoclet) {
  var content = '<!-- meta -->';

  var meta = wrappedDoclet.get('meta');
  if (!docletUtils.canWriteValue(meta)) {
    return content;
  }

  content += pageUtils.p(function metaInner() {
    var title = 'Source: ';

    return pageUtils.strong(title) + docletUtils.linkTo(meta.sourceLink);
  });

  return content;
};

module.exports = {
  // render:
  renderDetails: _renderDetails
};
