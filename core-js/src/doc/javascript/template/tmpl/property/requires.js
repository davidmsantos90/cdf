var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

/*global module */

var _render = function(wrappedDoclet) {
  var output = '<!-- requires -->';

  var requires = wrappedDoclet.get('requires');
  if (!docletUtils.canWriteValue(requires)) {
    return output;
  }

  var title = 'Requires';
  output += pageUtils.h3(title, { class: 'subsection-title' });

  output += _buildRequiresList(requires);

  return output;
};

module.exports = {
  render: _render
};

// region Private
var _buildRequiresList = function(requires) {
  var values = requires.map(function(req) {
    return docletUtils.linkTo(req, req)
  });

  return pageUtils.buildUnorderedList(values);
};
// endregion
