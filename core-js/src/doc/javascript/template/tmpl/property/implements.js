var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

/*global module */

var _render = function(wrappedDoclet) {
  var implementsContent = '<!-- implements -->';

  var _implements = wrappedDoclet.get('implements');
  if (!docletUtils.canWriteValue(_implements)) {
    return implementsContent;
  }

  var title = 'Implements';
  implementsContent += pageUtils.p(title, { class: 'h3' });

  implementsContent += _buildImplementsList(_implements);

  return implementsContent;
};

var _renderDetails = function(wrappedDoclet) { // from: details.tmpl
  var content = '';

  var isConstructor = wrappedDoclet.isClass && !wrappedDoclet.isStatic;
  var _implements = wrappedDoclet.get('implements');

  if (isConstructor || !docletUtils.canWriteValue(_implements)) {
    return content;
  }

  var title = 'Implements: ';
  var properties = { class: 'implements' };
  content += pageUtils.dt(title, properties);

  var value = _buildImplementsList(_implements);
  content += pageUtils.dd(value, properties);

  return content;
};

module.exports = {
  render: _render,
  renderDetails: _renderDetails
};

// region Private
var _buildImplementsList = function(_implements) {
  var values = _implements.map(function(impl) {
    return docletUtils.safeLinkTo(impl, impl)
  });

  return pageUtils.buildUnorderedList(values);
};
// endregion
