var metaProperty = require('../property/meta');
var defaultValueProperty = require('../property/defaultValue');
var versionProperty = require('../property/version');
var sinceProperty = require('../property/since');
var copyrightProperty = require('../property/copyright');
var licenseProperty = require('../property/license');

var propertiesProperty = require('../property/properties');
var inheritsProperty = require('../property/inherits');
var overridesProperty = require('../property/overrides');
var implementationsProperty = require('../property/implementations');
var implementsProperty = require('../property/implements');
var mixinsProperty = require('../property/mixins');
var authorsProperty = require('../property/authors');
var tutorialsProperty = require('../property/tutorials');
var todosProperty = require('../property/todos');

/*global module */

var _render = function(wrappedDoclet) { // from: details.tmpl
  var isConstructor = wrappedDoclet.isClass && !wrappedDoclet.isStatic;

  var detailsContent = '';

  detailsContent += propertiesProperty.renderDetails(wrappedDoclet);

  detailsContent += metaProperty.renderDetails(wrappedDoclet);

  detailsContent += inheritsProperty.renderDetails(wrappedDoclet);

  detailsContent += defaultValueProperty.renderDetails(wrappedDoclet);

  detailsContent += versionProperty.renderDetails(wrappedDoclet);

  detailsContent += sinceProperty.renderDetails(wrappedDoclet);

  detailsContent += overridesProperty.renderDetails(wrappedDoclet);

  detailsContent += implementationsProperty.renderDetails(wrappedDoclet);

  if (!isConstructor) {
    detailsContent += implementsProperty.renderDetails(wrappedDoclet);

    detailsContent += mixinsProperty.renderDetails(wrappedDoclet);

    detailsContent += authorsProperty.renderDetails(wrappedDoclet);
  }

  detailsContent += copyrightProperty.renderDetails(wrappedDoclet);

  detailsContent += licenseProperty.renderDetails(wrappedDoclet);

  detailsContent += tutorialsProperty.renderDetails(wrappedDoclet);

  detailsContent += todosProperty.renderDetails(wrappedDoclet);

  return detailsContent;
};

module.exports = {
  render: _render
};
