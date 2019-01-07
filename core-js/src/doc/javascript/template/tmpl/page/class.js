// var docletUtils = require('../doclet/utils');
var pageUtils = require('./utils');

var membersSection = require('../generic/members.section');
var methodsSection = require('../generic/methods.section');
var eventsSection = require('../generic/events.section');
var typeDefSection = require('../generic/typeDef.section');
var headerSection = require('../generic/header.section');

var amdProperty = require('../property/amd');
var seeProperty = require('../property/see');
var examplesProperty = require('../property/examples');
var augmentsProperty = require('../property/augments');
var requiresProperty = require('../property/requires');
var implementsProperty = require('../property/implements');
var mixinsProperty = require('../property/mixins');
var summarySection = require('../generic/summary.section');

/* global module */
exports = module.exports = function(view, wrappedDoclet) {
  var kind = wrappedDoclet.get('kind');

  var classPage = pageUtils.Page(view, wrappedDoclet, kind);

  classPage._renderTopSection = renderTopSection.bind(classPage);
  classPage._renderSummarySection = renderSummarySection.bind(classPage);
  classPage._renderDetailSection = renderDetailSection.bind(classPage);

  return classPage;
};

var renderTopSection = function(wrappedDoclet) {
  var methodsSummary = methodsSection.summary;

  var output = '';

  output += headerSection.render(wrappedDoclet);

  output += amdProperty.render(wrappedDoclet);
  output += seeProperty.render(wrappedDoclet);
  output += augmentsProperty.render(wrappedDoclet);

  if (!wrappedDoclet.isStatic) {
    output += implementsProperty.render(wrappedDoclet);

    output += mixinsProperty.render(wrappedDoclet);
  }

  output += examplesProperty.render(wrappedDoclet);

  if (!wrappedDoclet.isStatic) {
    output += methodsSummary.renderConstructor(wrappedDoclet);
  }

  output += requiresProperty.render(wrappedDoclet);

  return output;
};

var renderSummarySection = function(wrappedDoclet) {
  var membersSummary = membersSection.summary;
  var methodsSummary = methodsSection.summary;
  var eventsSummary = eventsSection.summary;

  var output = '';

  output += summarySection.namespacesRender(wrappedDoclet);
  output += summarySection.classesRender(wrappedDoclet);

  output += summarySection.staticEventsRender(wrappedDoclet);
  output += summarySection.interfacesRender(wrappedDoclet);
  output += summarySection.mixinsRender(wrappedDoclet);

  output += membersSummary.render(wrappedDoclet);
  output += methodsSummary.render(wrappedDoclet);
  output += eventsSummary.renderInstance(wrappedDoclet);

  return output;
};

var renderDetailSection = function(wrappedDoclet) {
  var membersDetails = membersSection.details;
  var methodsDetails = methodsSection.details;
  var eventsDetails = eventsSection.details;
  var typeDefDetails = typeDefSection.details;

  var output = '';

  output += methodsDetails.renderConstructor(wrappedDoclet);

  output += membersDetails.render(wrappedDoclet);
  output += methodsDetails.render(wrappedDoclet);

  output += eventsDetails.render(wrappedDoclet);

  output += typeDefDetails.render(wrappedDoclet);

  return output;
};
