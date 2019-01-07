var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

/*global module */

var _renderDetails = function(wrappedDoclet) { // from: details.tmpl
  var content = '<!-- version -->';

  var version = wrappedDoclet.get('version');
  if (!docletUtils.canWriteValue(version)) {
    return content;
  }

  var title = 'Version: ';
  var properties = { class: 'tag-version' };
  content += pageUtils.dt(title, properties);

  var value = _buildVersionDetailsList(version);
  content += pageUtils.dd(value, properties);

  return content;
};

module.exports = {
  renderDetails: _renderDetails
};

// region Private
var _buildVersionDetailsList = function(version) {
  var listConfig = { item: { class: 'dummy' } };

  return pageUtils.buildUnorderedList(version, listConfig);
};
// endregion
