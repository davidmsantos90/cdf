var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

/*global module */

// from: augments.tmpl
var _render = function(wrappedDoclet) {
  var output = '<!-- augments -->';

  var augments = wrappedDoclet.get('augments');
  if (!docletUtils.canWriteValue(augments)) {
    return output;
  }

  var title = 'Extends';
  output += pageUtils.p(title, { class: 'h3' });

  output += pageUtils.buildUnorderedList(augments);

  // if (output !== '') {
  //   console.log('     - P: extends rendered');
  // }

  return output;
};

module.exports = {
  render: _render
  // renderDetails: _render
};
