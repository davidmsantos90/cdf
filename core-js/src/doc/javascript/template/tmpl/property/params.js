var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

var modifiers = require('../generic/modifiers.section');
var typeProperty = require('./type');

/*global module */

var _renderDetails = function(wrappedDoclet) { // from params.tmpl
  var content = '<!-- params -->';

  var subParams = wrappedDoclet.get('subparams');
  var parameters = !docletUtils.canWriteValue(subParams) ? wrappedDoclet.get('params') : subParams;

  if (!docletUtils.canWriteValue(parameters)) {
    return content;
  }

  var parentParam = null;
  parameters.forEach(function(param, i) {
    if (!docletUtils.canWriteValue(param)) {
      return;
    }

    var paramRegExp;

    var name = param.get('name');
    var parentName = parentParam != null ? parentParam.get('name') : null;

    if (parentName && name) {
      paramRegExp = new RegExp('^(?:' + parentName + '(?:\\[\\])*)\\.(.+)$');

      if (paramRegExp.test(name)) {
        param.set('name', RegExp.$1);

        var subParams = parentParam.get('subparams', []);
        subParams.push(param);
        parentParam.set('subparams', subParams);

        parameters[i] = null;
      } else {
        parentParam = param;
      }
    } else {
      parentParam = param;
    }
  });

  /* determine if we need extra columns, "attributes" and "default" */
  parameters.hasAttributes = false;
  parameters.hasDefault = false;
  parameters.hasName = false;

  parameters.filter(function(param) {
    return param != null;
  }).forEach(function(param) {
    if (param.get('optional') || param.get('nullable') || param.get('variable')) {
      parameters.hasAttributes = true;
    }

    if (param.get('name')) {
      parameters.hasName = true;
    }

    if (docletUtils.canWriteValue(param.get('defaultvalue'))) {
      parameters.hasDefault = true;
    }
  });


  content += _buildDetailTable(wrappedDoclet.view, parameters);

  return content;
};

module.exports = {
  // render: _render,
  renderDetails: _renderDetails
};

// region Private
var _buildDetailTable = function(view, parameters) {
  var headers = ['Name', 'Default Value', 'Summary'];
  var values = _propertiesDetailTableValues(view, parameters);
  var config = { table: { class: 'inner-table' } };

  return pageUtils.buildGenericTable(headers, values, config);
};

var _propertiesDetailTableValues = function(view, parameters) {
  return parameters.filter(function(param) {
    return param != null;
  }).map(function(param) {
    var firstCell = param.get('name') + ':' + typeProperty.render(param);
    if (parameters.hasAttributes) {
      var firstInner = '';

      if (param.get('optional')) {
        firstInner += modifiers.badge('gray', 'Optional');
      }

      if (param.get('variable')) {
        firstInner += modifiers.badge('purple', 'Repeatable');
      }

      firstCell += pageUtils.div(firstInner);
    }

    var secondCell = '';
    var defaultValue = param.get('defaultvalue');
    if (docletUtils.canWriteValue(defaultValue)) {
      secondCell += docletUtils.htmlSafe(defaultValue);
    }

    var description = param.get('description', '');
    var thirdCell = docletUtils.canWriteValue(description)
      ? description.replace(/({@link [^}]+)&quot;([^}]+)&quot;([^}]*})/g, "$1\"$2\"$3")
      : '';

    if (docletUtils.canWriteValue(param.get('subparams'))) {
      thirdCell += _renderDetails(param);
    }

    return [firstCell, secondCell, thirdCell];
  })
};
// endregion
