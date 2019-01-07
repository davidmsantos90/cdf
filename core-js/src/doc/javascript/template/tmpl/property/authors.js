var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

/*global module */

// from: details.tmpl
var _renderDetails = function(wrappedDoclet) {
  var content = '<!-- authors -->';

  var isConstructor = wrappedDoclet.isClass && !wrappedDoclet.isStatic;
  var authors = wrappedDoclet.get('author');

  if (isConstructor || !docletUtils.canWriteValue(authors)) {
    return content;
  }

  var title = 'Author: ';
  var properties = { class: 'tag-author' };
  content += pageUtils.dt(title, properties);

  var value = _buildAuthorsDetailList(authors);
  content += pageUtils.dd(value, properties);

  return content;
};

module.exports = {
  // render: _renderDetails,
  renderDetails: _renderDetails
};

// region Private
var _buildAuthorsDetailList = function(authors) {
  var values = authors.map(function(author) {
    return docletUtils.resolveAuthorLinks(author);
  });

  return pageUtils.buildUnorderedList(values);
};
// endregion
