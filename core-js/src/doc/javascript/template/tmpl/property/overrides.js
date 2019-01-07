var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

/*global module */

var _renderDetails = function(wrappedDoclet) { // from: details.tmpl
  var content = '<!-- overrides -->';

  var overrides = wrappedDoclet.get('overrides');
  if (!docletUtils.canWriteValue(overrides)) {
    return content;
  }

  content += pageUtils.p(function overridesInner() {
    var title = 'Overrides: ';

    return  pageUtils.strong(title) + docletUtils.safeLinkTo(overrides, overrides);
  });

  return content;
};

module.exports = {
  // render: _render,
  renderDetails: _renderDetails
};

// region Private
