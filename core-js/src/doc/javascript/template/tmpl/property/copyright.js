var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

/*global module */

// from: details.tmpl
var _renderDetails = function(wrappedDoclet) {
  var content = '<!-- copyright -->';

  var copyright = wrappedDoclet.get('copyright');
  if (!docletUtils.canWriteValue(copyright)) {
    return content;
  }

  var title = 'Copyright: ';
  var properties = { class: 'tag-copyright' };
  content += pageUtils.dt(title, properties);

  var value = _buildCopyrightDetailsList(copyright);
  content += pageUtils.dd(value, properties);

  return content;
};

module.exports = {
  // render: _renderDetails,
  renderDetails: _renderDetails
};

// region Private
var _buildCopyrightDetailsList = function(version) {
  var listConfig = { item: { class: 'dummy' } };

  return pageUtils.buildUnorderedList(version, listConfig);
};
// endregion
