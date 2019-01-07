var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

/*global module */

// from: details.tmpl
var _renderDetails = function(wrappedDoclet) {
  var content = '<!-- implementations -->';

  var implementations = wrappedDoclet.get('implementations');
  if (!docletUtils.canWriteValue(implementations)) {
    return content;
  }

  var title = 'Implementations: ';
  var properties = { class: 'implementations' };
  content += pageUtils.dt(title, properties);

  var value = _buildImplementationsList(implementations);
  content += pageUtils.dd(value, properties);

  return content;
};

module.exports = {
  // render:
  renderDetails: _renderDetails
};

var _buildImplementationsList = function(implementations) {
  var values = implementations.map(function(impl) {
    return docletUtils.safeLinkTo(impl, impl);
  });

  return pageUtils.buildUnorderedList(values);
};

