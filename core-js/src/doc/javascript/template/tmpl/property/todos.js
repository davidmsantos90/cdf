var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

/*global module */

var _renderDetails = function(wrappedDoclet) { // from: details.tmpl
  var content = '<!-- todos -->';

  var tutorials = wrappedDoclet.get('todo');
  if (!docletUtils.canWriteValue(tutorials)) {
    return content;
  }

  var title = 'To Do: ';
  var properties = { class: 'tag-todo' };
  content += pageUtils.dt(title, properties);

  var value = _buildTodosList(tutorials);
  content += pageUtils.dd(value, properties);

  return content;
};

module.exports = {
  renderDetails: _renderDetails
};

// region Private
var _buildTodosList = function(todos) {
  return pageUtils.buildUnorderedList(todos);
};
// endregion
