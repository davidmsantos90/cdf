var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

/*global module */

var _render = function mixinsRender(wrappedDoclet) {
  var output = '<!-- mixins -->';

  var mixins = wrappedDoclet.get('mixes');
  if (!docletUtils.canWriteValue(mixins)) {
    return output;
  }

  var title = 'Mixes In';
  output += pageUtils.p(title, { class: 'h3' });

  output += _buildMixinsList(mixins);

  return output;
};

var _renderDetails = function mixinsDetailRender(wrappedDoclet) { // from: details.tmpl
  var content = '';

  var isConstructor = wrappedDoclet.isClass && !wrappedDoclet.isStatic;
  var mixins = wrappedDoclet.get('mixes');

  if (isConstructor || !docletUtils.canWriteValue(mixins)) {
    return content;
  }

  var title = 'Mixes In: ';
  var properties = { class: 'mixes' };
  content += pageUtils.dt(title, properties);

  var value = _buildMixinsList(mixins);
  content += pageUtils.dd(value, properties);

  return content;
};

module.exports = {
  render: _render,
  renderDetails: _renderDetails
};

// region Private
var _buildMixinsList = function(mixins) {
  var values = mixins.map(function(mix) {
    return docletUtils.linkTo(mix, mix)
  });

  return pageUtils.buildUnorderedList(values);
};
// endregion
