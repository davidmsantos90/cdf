var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

/*global module */

// from: details.tmpl
var _renderDetails = function(wrappedDoclet) {
  var content = '<!-- inherits -->';

  var inherited = wrappedDoclet.get('inherited');
  var inherits = wrappedDoclet.get('inherits');
  var overrides = wrappedDoclet.get('overrides');

  var canWriteInheritedFrom = docletUtils.canWriteValue(inherited) && docletUtils.canWriteValue(inherits) && !docletUtils.canWriteValue(overrides);
  if (!canWriteInheritedFrom) {
    return content;
  }

  content += pageUtils.p(function inheritsInner() {
    var title = 'Inherited From: ';

    return pageUtils.strong(title) + docletUtils.linkTo(inherits, inherits.split('"').join(''));
  });


  return content;
};

module.exports = {
  // render:
  renderDetails: _renderDetails
};
