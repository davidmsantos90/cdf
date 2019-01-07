var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

/*global module */

// container.tmpl
var _render = function(wrappedDoclet) {
  var descriptionContent = '<!-- description -->';

  var description = wrappedDoclet.get('description');
  if (!docletUtils.canWriteValue(description)) {
    return descriptionContent;
  }

  descriptionContent += pageUtils.div(description, { class: 'description' });

  return descriptionContent;
};

module.exports = {
  render: _render
  // renderDetails: _render
};
