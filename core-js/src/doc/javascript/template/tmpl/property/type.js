var docletUtils = require('../doclet/utils');
// var pageUtils = require('../page.utils');

/*global module */

// from: type.tmpl
var _render = function(wrappedDoclet) {
  var typeContent = '<!-- type -->';

  var type = wrappedDoclet.get('type');
  if (!docletUtils.canWriteValue(type)) {
    return typeContent;
  }

  var typeNames = type.names || [];
  var size = typeNames.length;

  typeNames.forEach(function(name, index) {
    typeContent += wrappedDoclet._typeBuilder(name, index, size);
  });

  return typeContent;
};

module.exports = {
  render: _render
};
