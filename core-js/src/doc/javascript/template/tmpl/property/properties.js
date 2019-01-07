var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

var modifiers = require('../generic/modifiers.section');
var typeProperty = require('./type');

/*global module */

var _renderDetails = function(wrappedDoclet) { // from properties.tmpl
  var content = '<!-- properties -->';

  var subProperties = wrappedDoclet.get('subprops');
  var properties = !docletUtils.canWriteValue(subProperties) ? wrappedDoclet.get('properties') : subProperties;

  if (!docletUtils.canWriteValue(properties)) {
    return content;
  }

  var parentProp = null;
  properties.forEach(function(prop, i) {
    if (!docletUtils.canWriteValue(prop)) {
      return;
    }

    var name = prop.get('name', '');
    var parentName = parentProp != null ? parentProp.get('name') : null;

    if (parentName != null && name.indexOf(parentName + '.') === 0) {
      prop.set('name', name.substr(parentName.length + 1));

      var subProperties = parentProp.get('subprops', []);
      subProperties.push(prop);
      parentProp.set('subprops', parentProp);

      properties[i] = null;
    } else {
      parentProp = prop;
    }
  });

  /* determine if we need extra columns, "attributes" and "default" */
  properties.hasAttributes = false;
  properties.hasDefault = false;
  properties.hasName = false;

  properties.filter(function(prop) {
    return prop != null;
  }).forEach(function(prop) {
    if (prop.get('optional') || prop.get('nullable')) {
      properties.hasAttributes = true;
    }

    if (prop.get('name')) {
      properties.hasName = true;
    }

    if (docletUtils.canWriteValue(prop.get('defaultvalue')) && !wrappedDoclet.get('isEnum')) {
      properties.hasDefault = true;
    }
  });


  content += _buildPropertiesDetailTable(wrappedDoclet.view, properties);

  return content;
};

module.exports = {
  renderDetails: _renderDetails
};

// region Private
var _buildPropertiesDetailTable = function(view, properties) {
  var headers = ['Name', 'Default Value', 'Description'];
  var values = _propertiesDetailTableValues(view, properties);
  var config = { table: { class: 'inner-table' } };

  return pageUtils.buildGenericTable(headers, values, config);
};

var _propertiesDetailTableValues = function(view, properties) {
  return properties.filter(function(prop) {
    return prop != null;
  }).map(function(prop) {
    var firstCell = prop.name + ':' + typeProperty.render(prop);
    if (properties.hasAttributes) {
      if (prop.get('optional')) {
        firstCell += modifiers.badge('gray', 'Optional');
      }

      if (prop.get('nullable')) {
        firstCell += modifiers.badge('gray', 'Nullable');
      }

      if (prop.get('variable')) {
        firstCell += modifiers.badge('purple', 'Repeatable');
      }
    }

    var secondCell = '';
    if (typeof prop.defaultvalue !== 'undefined') {
      secondCell += docletUtils.htmlSafe(prop.defaultvalue);
    }

    var thirdCell = prop.get('description', '');
    if (docletUtils.canWriteValue(prop.get('subprops'))) {
      thirdCell += _renderDetails(prop);
    }

    return [firstCell, secondCell, thirdCell];
  })
};
// endregion
