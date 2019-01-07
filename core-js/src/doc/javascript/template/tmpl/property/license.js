var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

/*global module */

var _renderDetails = function(wrappedDoclet) { // from: details.tmpl
  var content = '<!-- license -->';

  var license = wrappedDoclet.get('license');
  if (!docletUtils.canWriteValue(license)) {
    return content;
  }

  var title = 'License: ';
  var properties = { class: 'tag-license' };
  content += pageUtils.dt(title, properties);

  var value = _buildLicenseDetailsList(license);
  content += pageUtils.dd(value, properties);

  return content;
};

module.exports = {
  // render:
  renderDetails: _renderDetails
};

// region Private
var _buildLicenseDetailsList = function(license) {
  var listConfig = { item: { class: 'dummy' } };

  return pageUtils.buildUnorderedList(license, listConfig);
};
// endregion
