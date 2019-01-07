var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

var modifiersSection = require('./modifiers.section');

/* global module */

var _render = function(wrappedDoclet) {
  var output = '';

  var isValid = !wrappedDoclet.get('longname') || !wrappedDoclet.isModule;
  if (!isValid) {
    return output;
  }

  output += pageUtils.h2(function h2Content() {
    var h2Content = '';

    var ancestors = wrappedDoclet.get('ancestors');
    if (docletUtils.canWriteValue(ancestors)) {
      h2Content = pageUtils.span(ancestors.join(''), { class: 'ancestors' });
    }

    var parsedname = wrappedDoclet.get('parsedName');
    if (docletUtils.canWriteValue(parsedname)) {
      h2Content = pageUtils.span(parsedname);
    }

    var variation = wrappedDoclet.get('variation');
    if (docletUtils.canWriteValue(variation)) {
      h2Content = pageUtils.sup(variation, { class: 'variation' });
    }

    return h2Content;
  });

  if (wrappedDoclet.isStatic) {
    output += modifiersSection.render(wrappedDoclet.doclet);
  }

  var classDescription = wrappedDoclet.get('classdesc');
  if (docletUtils.canWriteValue(classDescription)) {
    output += classDescription.replace(/({@link [^}]+)&quot;([^}]+)&quot;([^}]*})/g, "$1\"$2\"$3") || '';
  }

  return output;
};

module.exports = {
  render: _render
};
