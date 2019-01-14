var pageUtils = require('../page/utils');

var helper = require('jsdoc/util/templateHelper');
var path = require('jsdoc/path');

/* global module */
// override original htmlsafe function
helper.htmlsafeOrig = helper.htmlsafe;

module.exports.htmlSafe = helper.htmlsafe = function(string) {
  return helper.htmlsafeOrig( string ).replace(/>/g, '&gt;').replace(/\n/g, '<br>');
};

module.exports.linkTo = helper.linkto;
module.exports.safeLinkTo = function(longname, linkText) {
  linkText = linkText != null ? helper.htmlsafe(linkText) : linkText;

  return helper.linkto(longname, linkText);
};

module.exports.resolveAuthorLinks = helper.resolveAuthorLinks;

module.exports.tutorialLink = function(tutorial) {
  return helper.toTutorial(tutorial, null, { tag: 'em', classname: 'disabled', prefix: 'Tutorial: ' });
};

module.exports.helper = helper;

module.exports.canWriteValue = function(value) {
  if (value == null) {
    return false;
  }

  var isString = typeof value === 'string';
  if (isString) {
    return value !== '';
  }

  var isArray = Array.isArray(value);
  if (isArray) {
    return value.length > 0;
  }

  var isBoolean = typeof value === 'boolean';
  if (isBoolean) {
    return value;
  }

  return true;
};

var KIND_CLASS = module.exports.KIND_CLASS = 'class';
var KIND_INTERFACE = module.exports.KIND_INTERFACE = 'interface';
var KIND_NAMESPACE = module.exports.KIND_NAMESPACE = 'namespace';
var KIND_EVENT = module.exports.KIND_EVENT = 'event';
var KIND_MIXIN = module.exports.KIND_MIXIN = 'mixin';
var KIND_MODULE = module.exports.KIND_MODULE = 'module';
/*var KIND_MEMBER = */module.exports.KIND_MEMBER = 'member';
/*var KIND_CONSTANT = */module.exports.KIND_CONSTANT = 'constant';
var KIND_SOURCE = module.exports.KIND_SOURCE = 'source';
var KIND_GLOBAL = module.exports.KIND_GLOBAL = 'globalobj';
var KIND_PACKAGE = module.exports.KIND_PACKAGE = 'package';
var KIND_MAIN = module.exports.KIND_MAIN = 'mainpage';
var KIND_FUNCTION = module.exports.KIND_FUNCTION = 'function';
var KIND_TYPEDEF = module.exports.KIND_TYPEDEF = 'typedef';

/*var GLOBAL_MEMBER_OF = */exports.GLOBAL_MEMBER_OF = { isUndefined: true };

module.exports._dashboardHardcodedFix = function(value) {
  // hardcoded fix for "Dashboard.Blueprint", "Dashboard.Bootstrap" and "Dashboard.Clean"
  return value.replace(/"?(Dashboard)\.(\w+)"?/, "$1");
};

var shouldWrap = [
  'params', 'subparams', 'properties', 'subprops',
  'returns', 'exceptions'
];

var Wrapper = function(view, doclet) {
  if (doclet._wrapped) return doclet;

  var kind = doclet.kind;

  return {
    _wrapped: true,

    _wrap: function(value) {
      if (value == null) return value;

      var view = this.view;

      if (!Array.isArray(value)) {
        return Wrapper(view, value);
      }

      return value.map(function(v) {
        return Wrapper(view, v);
      });
    },

    view: view,

    doclet: doclet || {},
    original: function() {
      return doclet;
    },

    set: function(prop, value) {
      this.doclet[prop] = value;
    },

    get: function (prop, defaultValue) {
      if (prop === 'nav') {
        return this.view.nav;
      }

      var value = this.doclet[prop];
      if (value == null && defaultValue != null) {
        value = defaultValue;
      }

      if (shouldWrap.indexOf(prop) !== -1) {
        value = this._wrap(value);
      }

      return value;
    },

    isEqualTo: function(prop, test) {
      return this.doclet[prop] === test;
    },

    isStatic: doclet.static === true,

    isClass: kind === KIND_CLASS,
    isInterface: kind === KIND_INTERFACE,
    isNamespace: kind === KIND_NAMESPACE,
    isEvent: kind === KIND_EVENT,
    isMixin: kind === KIND_MIXIN,

    isModule: kind === KIND_MODULE,
    isSource: kind === KIND_SOURCE,
    isGlobal: kind === KIND_GLOBAL,
    isPackage: kind === KIND_PACKAGE,
    isMainPage: kind === KIND_MAIN || kind === KIND_PACKAGE,

    _find: function (kind, scope) {
      var memberOf = this.get('longname');

      var doclets = [].concat(view.find({kind: kind, memberof: memberOf, scope: scope}));

      return this._wrap(doclets);
    },

    _globalFind: function(kind) {
      var view = this.view;
      var memberOf = { isUndefined: true };

      var doclets = [].concat(view.find({kind: kind, memberof: memberOf }));

      return this._wrap(doclets);
    },

    _typeBuilder: view._typeBuilder
  }
};

module.exports.wrap = Wrapper;

// functions extracted from publish

module.exports.checkParagraph = function(doclet, property) {
  var value = doclet && doclet[property];
  if (value == null) {
    return value;
  }

  if (value.indexOf('<p>') > -1) {
    // value = value.replace(/<p><p>/g, '<p>');
    value = value.replace(/(?:<p>)+([^(<p>)]+)/g, function(match, p1) {
      return "<p>" + p1;
    });
  } else {
    value = pageUtils.p(value);
  }

  // --- code ---

  var codeFlip = {
    _state: null,

    _open: '<code>',
    _close: '</code>',

    get tag() {
      var state = this._state;

      if (state == null || state === this._close) {
        this._state = state = this._open;
      } else if (state === this._open) {
        this._state = state = this._close;
      }

      return state;
    }
  };

  var idx;
  while ((idx = value.indexOf('`')) > -1) {
    value = value.substring(0, idx) + codeFlip.tag + value.substring(idx + 1);
  }

  return value;
};

module.exports.getSourcePath = function(doclet) {
  var meta = doclet.meta;
  if (meta == null) {
    return meta;
  }

  var docletPath = meta.path;
  var docletFilename = meta.filename;

  return docletPath != null && docletPath !== 'null'
    ? path.join(docletPath, docletFilename)
    : docletFilename;
};

module.exports.needSignature = function(doclet) {
  var kind = doclet.kind;

  if (kind === KIND_FUNCTION || kind === KIND_CLASS) {
    return true;
  }

  if (kind === KIND_TYPEDEF) {
    var typeNames = doclet.type && doclet.type.names;

    for (var n = 0, L = typeNames.length; n < L; n++) {
      var name = typeNames[n];
      if (name.toLowerCase() === KIND_FUNCTION) {
        return true;
      }
    }
  }

  return false;
};

module.exports.getSignatureWithTypes = function(doclet) {
  var signature = doclet.signature || '';

  signature += pageUtils.span(function() {
    var typeNames = (doclet.type && doclet.type.names) || [];

    var types = typeNames.map(function(name) {
      return helper.linkto(name, helper.htmlsafe(name));
    });

    var content = '';

    if (types.length > 0) {
      content += ':' + types.join('|');
    }

    return content;
  }, { class: 'type-signature' });

  return signature;
};

module.exports.getSignatureWithParameters = function(doclet) {
  var parameters = (doclet.params || []).filter(function(param) {
    var name = param.name;

    return name != null && name.indexOf('.') === -1;
  }).map(function(param) {
    return param.name || '';
  });

  var signature = doclet.signature || '';
  if (!parameters.length) {
    return signature;
  }

  return signature + '(' + parameters.join(', ') + ')';
};

module.exports.getAttributes = function(doclet) {
  var attributes = helper.getAttribs(doclet) || [];
  if (!attributes.length) {
    return null;
  }

  return pageUtils.span(function() {
    var content = '(' + attributes.join(', ') + ')';

    return helper.htmlsafe(content);
  }, { class: 'type-signature' });
};

module.exports.getProperties = function(doclet) {
  var properties = doclet.properties;
  if (properties == null) {
    return properties;
  }

  var separator = ' - ';
  var separatorLength = separator.length;

  return properties.map(function(property) {
    var defaultValue = property.defaultvalue;
    var description = property.description;

    var separatorIndex = description.indexOf(separator);
    if (defaultValue !== 'undefined' && !property.optional && separatorIndex > 0) {
      defaultValue += " " + description.substr(separatorLength, separatorIndex - separatorLength);
      description = '<p>' + description.substr(separatorIndex + separatorLength/*, description.length*/);
    }

    return {
      defaultvalue: defaultValue,
      description: description,
      type: property.type,
      name: property.name
    }
  });
};

var _getExamples = function(examples) {
  if (examples == null) {
    return examples;
  }

  return examples.map(function(example) {
    var caption = '';
    var code = example;

    var match = example.match(/^\s*<caption>([\s\S]+?)<\/caption>(\s*[\n\r])([\s\S]+)$/i);
    if (match != null) {
      caption = match[1];
      code = match[3];
    }

    return {
      caption: caption, code: code
    };
  });
};

module.exports.getExamples = function(doclet) {
  var examples = doclet.examples;

  return _getExamples(examples);
};

module.exports.getCodeExamples = function(doclet) {
  var examples = doclet.codeExamples;

  return _getExamples(examples);
};

module.exports.getSeeLinks = function(doclet) {
  var seeLinks = doclet.see;
  if (seeLinks == null) {
    return seeLinks;
  }

  return seeLinks.map(function(hash) {
    if (!/^(#.+)/.test(hash)) {
      return hash;
    }

    var url = helper.createLink(doclet).replace(/(#.+|$)/, hash);

    return pageUtils.a(hash, { href: url });
  });
};

