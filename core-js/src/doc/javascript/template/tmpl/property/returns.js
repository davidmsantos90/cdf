var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

var typeProperty = require('./type');

/*global module */

// from: method.section
var _render = function(wrappedDoclet) {
  var content = '<!-- returns -->';

  var returns = wrappedDoclet.get('returns');
  if (!docletUtils.canWriteValue(returns)) {
    return content;
  }

  content += returns.filter(function(_return) {
    return docletUtils.canWriteValue(_return);
  }).map(function(_return) {
    return typeProperty.render(_return);
  }).join(' | ');

  return content;
};

// from: returns.tmpl and method.section
var _renderDetails = function(wrappedDoclet) {
  var content = '';

  var returns = wrappedDoclet.get('returns');
  if (!docletUtils.canWriteValue(returns)) {
    return content;
  }

  content += _buildDetailsTable(returns);

  return content;
};

module.exports = {
  render: _render,
  renderDetails: _renderDetails
};

// region Private
var _buildDetailsTable = function(returns) {
  var headers = null;
  var values = returns.filter(function(_return) {
    return docletUtils.canWriteValue(_return)
  }).map(function(_return) {
    if (_return.get('nullable')) {
      var type = _return.get('type', { names: [] });

      type.names.push('null');

      _return.set('type', type);
    }

    var firstCell = typeProperty.render(_return);

    var secondCell = _return.get('description');
    var regex = /array.<(.*)>/;
    var match = regex.exec(secondCell);
    if (match) {
      secondCell = match[1];
    }

    return [firstCell, secondCell];
  });

  var config = { caption: 'Returns:', table: { class: 'inner-table' } };

  return pageUtils.buildGenericTable(headers, values, config);
};
// endregion
