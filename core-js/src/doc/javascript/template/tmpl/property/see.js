var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

/*global module */

// also detail
var _render = function(wrappedDoclet) {
  var output = '<!-- see -->';

  var seeLinks = wrappedDoclet.get('see');
  if (!docletUtils.canWriteValue(seeLinks)) {
    return output;
  }

  output += pageUtils.p(function seeLinkInnerP() {
    var seeLinkContent = '';

    var title = 'See also:&nbsp;';
    seeLinkContent += pageUtils.strong(title);

    seeLinkContent += _buildDetailCommaList(seeLinks);

    return seeLinkContent;
  });

  return output;
};

module.exports = {
  render: _render
};

// region Private
var _buildDetailCommaList = function(seeLinks) {
  return seeLinks.filter(function(link) {
    return docletUtils.canWriteValue(link);
  }).map(function(link) {
    return docletUtils.linkTo(link)
  }).join(', ');
};
// endregion
