var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

/*global module */

var _renderDetails = function(wrappedDoclet) { // from: details.tmpl
  var content = '<!-- tutorials -->';

  var tutorials = wrappedDoclet.get('tutorials');
  if (!docletUtils.canWriteValue(tutorials)) {
    return content;
  }

  var title = 'Tutorials: ';
  var properties = { class: 'tag-tutorial' };
  content += pageUtils.dt(title, properties);

  var value = _buildTutorialsList(tutorials);
  content += pageUtils.dd(value, properties);

  return content;
};

module.exports = {
  renderDetails: _renderDetails
};

// region Private
var _buildTutorialsList = function(tutorials) {
  var values = tutorials.map(function(tut) {
    return docletUtils.tutorialLink(tut)
  });

  return pageUtils.buildUnorderedList(values);
};
// endregion
