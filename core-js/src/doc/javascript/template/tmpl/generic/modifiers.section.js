// var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

/* global module */

// from: modifier(s).tmpl
var _render = function(doclet) {
  return pageUtils.div(function modifiersContent() {
    var content = '';

    if (isDeprecated(doclet)) {
      content += _buildBadge('red', 'Deprecated');
    }

    if (isPrivate(doclet)) {
      content += _buildBadge('red', 'Private');
    }

    if (isStatic(doclet)) {
      content += _buildBadge('green', 'Static');
    }

    if (isConstant(doclet)) {
      content += _buildBadge('black', 'Constant');
    }

    if (isAbstract(doclet)) {
      content += _buildBadge('black', 'Abstract');
    }

    if (isProtected(doclet)) {
      content += _buildBadge('red', 'Protected');
    }

    return content;
  });
};

var _buildBadge = function(type, modifier) {
  return pageUtils.div(function badgeContent() {
    var badge = '';

    badge +=  pageUtils.div('&nbsp;', { class: 'stripe' });
    badge += pageUtils.div(modifier, { class: 'name' });

    return badge;
  }, { class: 'badge badge-' + type });
};

module.exports = {
  render: _render,
  badge: _buildBadge
};

// region Private
var isPrivate = function(doclet) {
  return doclet.access === 'private';
};

var isProtected = function(doclet) {
  return doclet.access === 'protected';
};

var isDeprecated = function(doclet) {
  return doclet.deprecated;
};

var isConstant = function(doclet) {
  return doclet.constant;
};

var isAbstract = function(doclet) {
  return doclet.virtual;
};

var isStatic = function(doclet) {
  return doclet.scopeEf === 'static' || doclet.static;
};
// endregion
