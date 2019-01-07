var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

/*global module */

// from: details.tmpl
var _renderDetails = function(wrappedDoclet) {
  var content = '<!-- defaultvalue -->';

  var defaultValue = wrappedDoclet.get('defaultvalue');
  if (!docletUtils.canWriteValue(defaultValue)) { // defaultValue || defaultValue === false
    return content;
  }

  var defaultValueType = wrappedDoclet.get('defaultvaluetype');
  if(defaultValueType === 'object' || defaultValueType === 'array') {
    defaultValue = pageUtils.pre(pageUtils.code(defaultValue), { class: 'prettyprint' });

    wrappedDoclet.set('defaultvalue', defaultValue); // TODO needed ??
  }

  content += pageUtils.p(function defaultValueInner() {
    var title = 'Default Value: ';

    return  pageUtils.strong(title) + defaultValue;
  });

  return content;
};

module.exports = {
  // render: _renderDetails,
  renderDetails: _renderDetails
};
