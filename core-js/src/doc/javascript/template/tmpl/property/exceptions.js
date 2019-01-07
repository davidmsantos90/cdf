var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

var typeProperty = require('./type');

/*global module */

// from: exceptions.tmpl and method.section
var _renderDetails = function(wrappedDoclet) {
  var content = '<!-- exceptions -->';

  var exceptions = wrappedDoclet.get('exceptions');
  if (!docletUtils.canWriteValue(exceptions)) {
    return content;
  }

  content += _buildDetailsTable(exceptions);

  return content;
};

module.exports = {
  render: _renderDetails,
  renderDetails: _renderDetails
};

// region Private
var _buildDetailsTable = function(exceptions) {
  var headers = null;
  var values = exceptions.map(function(_exception) {
    var firstCell = typeProperty.render(_exception);

    var secondCell = _exception.get('description');
    var regex = /array.<(.*)>/;
    var match = regex.exec(secondCell);
    if (match) {
      secondCell = match[1];
    }

    return [firstCell, secondCell];
  });
  var config = { caption: 'Throws:', table: { class: 'inner-table' } };

  return pageUtils.buildGenericTable(headers, values, config);
};
// endregion
