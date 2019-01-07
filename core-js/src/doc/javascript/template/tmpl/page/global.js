// var docletUtils = require('../doclet/utils');
var pageUtils = require('./utils');

var detailsSection = require('../generic/details.section');
var membersSection = require('../generic/members.section');
var methodsSection = require('../generic/methods.section');
var eventsSection = require('../generic/events.section');
var typeDefSection = require('../generic/typeDef.section');
var headerSection = require('../generic/header.section');

var descriptionProperty = require('../property/description');

var amdProperty = require('../property/amd');
var seeProperty = require('../property/see');
var examplesProperty = require('../property/examples');
var augmentsProperty = require('../property/augments');
var requiresProperty = require('../property/requires');

/* global module */
exports = module.exports = function(view, wrappedDoclet) {
  var kind = 'global';

  var globalPage = pageUtils.Page(view, wrappedDoclet, kind);

  globalPage._renderTopSection = renderTopSection.bind(globalPage);
  globalPage._renderSummarySection = renderSummarySection.bind(globalPage);
  globalPage._renderDetailSection = renderDetailSection.bind(globalPage);

  return globalPage;
};

var renderTopSection = function(wrappedDoclet) {
  var output = '';

  output += headerSection.render(wrappedDoclet);

  output += amdProperty.render(wrappedDoclet);
  output += descriptionProperty.render(wrappedDoclet);
  output += detailsSection.render(wrappedDoclet);

  output += seeProperty.render(wrappedDoclet);
  output += augmentsProperty.render(wrappedDoclet);
  output += examplesProperty.render(wrappedDoclet);
  output += requiresProperty.render(wrappedDoclet);

  return output;
};

var renderSummarySection = function(wrappedDoclet) {
  var membersSummary = membersSection.summary;
  var methodsSummary = methodsSection.summary;

  var output = '';

  output += membersSummary.renderGlobal(wrappedDoclet);
  output += methodsSummary.renderGlobal(wrappedDoclet);

  return output;
};

var renderDetailSection = function(wrappedDoclet) {
  var membersDetails = membersSection.details;
  var methodsDetails = methodsSection.details;
  var eventsDetails = eventsSection.details;
  var typeDefDetails = typeDefSection.details;

  var output = '';

  output += membersDetails.renderGlobal(wrappedDoclet);
  output += methodsDetails.renderGlobal(wrappedDoclet);
  output += eventsDetails.renderGlobal(wrappedDoclet);
  output += typeDefDetails.renderGlobal(wrappedDoclet);

  return output;
};
