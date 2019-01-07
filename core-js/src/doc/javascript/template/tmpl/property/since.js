var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

/*global module */

var _renderDetails = function(wrappedDoclet) { // from: details.tmpl
  var content = '<!-- since -->';

  var since = wrappedDoclet.get('since');
  if (!docletUtils.canWriteValue(since)) {
    return content;
  }

  var title = 'Since: ';
  var properties = { class: 'tag-since' };
  content += pageUtils.dt(title, properties);

  var value = _buildSinceDetailsList(since);
  content += pageUtils.dd(value, properties);

  return content;
};

module.exports = {
  renderDetails: _renderDetails
};

// region Private
var _buildSinceDetailsList = function(since) {
  var listConfig = { item: { class: 'dummy' } };

  return pageUtils.buildUnorderedList(since, listConfig);
};
// endregion
