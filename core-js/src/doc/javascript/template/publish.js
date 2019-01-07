/* global env: true */

'use strict';

var docletUtils = require('./tmpl/doclet/utils');
var pageUtils = require('./tmpl/page/utils');
var githubConfig = require('./github.config')();

var doop = require('jsdoc/util/doop');
var fs = require('jsdoc/fs');
var path = require('jsdoc/path');
var taffy = require('taffydb').taffy;
var template = require('jsdoc/template');
var util = require('util');

var renderContainer = require('./tmpl/template').render;

var helper = docletUtils.helper;

var htmlsafe = helper.htmlsafe;
var resolveAuthorLinks = helper.resolveAuthorLinks;

var data;
var view;

var outputDir = path.normalize(env.opts.destination);

// function tutoriallink(tutorial) {
//     return helper.toTutorial(tutorial, null, { tag: 'em', classname: 'disabled', prefix: 'Tutorial: ' });
// }

function needsSignature(doclet) {
    var needsSig = false;

    // function and class definitions always get a signature
    if (doclet.kind === 'function' || doclet.kind === 'class') {
        needsSig = true;
    }
    // typedefs that contain functions get a signature, too
    else if (doclet.kind === 'typedef' && doclet.type && doclet.type.names &&
        doclet.type.names.length) {
        for (var i = 0, l = doclet.type.names.length; i < l; i++) {
            if (doclet.type.names[i].toLowerCase() === 'function') {
                needsSig = true;
                break;
            }
        }
    }

    return needsSig;
}

function updateItemName(item) {
  return item.name || '';
}

function addParamAttributes(params) {
    return params.filter(function(param) {
        return param.name && param.name.indexOf('.') === -1;
    }).map(updateItemName);
}

function buildItemTypeStrings(item) {
    var types = [];

    if (item && item.type && item.type.names) {
        item.type.names.forEach(function(name) {
            types.push( helper.linkto(name, htmlsafe(name)) );
        });
    }

    return types;
}

function buildAttribsString(attribs) {
    var attribsString = '';

    if (attribs && attribs.length) {
        attribsString = htmlsafe( util.format('(%s) ', attribs.join(', ')) );
    }

    return attribsString;
}

function addSignatureParams(f) {
    var params = f.params ? addParamAttributes(f.params) : [];

    f.signature = util.format( '%s(%s)', (f.signature || ''), params.join(', ') );
}

function addSignatureTypes(f) {
    var types = f.type ? buildItemTypeStrings(f) : [];

    f.signature = (f.signature || '') + '<span class="type-signature">' +
        (types.length ? ' :' + types.join('|') : '') + '</span>';
}

function addAttribs(f) {
    var attribs = helper.getAttribs(f);
    var attribsString = buildAttribsString(attribs);

    f.attribs = util.format('<span class="type-signature">%s</span>', attribsString);
}

function shortenPaths(files, commonPrefix) {
    Object.keys(files).forEach(function(filename) {
        var file = files[filename];
        file.shortened = file.resolved.replace(commonPrefix, '')
            // always use forward slashes
            .replace(/\\/g, '/');
    });

    return files;
}

function getPathFromDoclet(doclet) {
    if (!doclet.meta) {
        return null;
    }

    return doclet.meta.path && doclet.meta.path !== 'null' ?
        path.join(doclet.meta.path, doclet.meta.filename) :
        doclet.meta.filename;
}

function getSourceFromDoclet(doclet, gitRepoName) {
  var path = doclet.meta.path.replace(/\\/g,"/");
  var pathLength = path.length;

  var nameLength = gitRepoName ? gitRepoName.length : 0;
  var nameIndexOf = gitRepoName ? path.indexOf(gitRepoName) + 1 : 0;

  return path.substring(nameIndexOf + nameLength, pathLength);
}

function getLinkFromDoclet(doclet) {
  if (!doclet.meta) {
    return null;
  }

  var filename = doclet.meta.filename;
  var shortPath = doclet.meta.shortpath;
  var lineNumber = doclet.meta.lineno;

  var repoName = githubConfig.name;
  var repoVersion = githubConfig.branch;

  var isJavascriptFile = shortPath && shortPath.indexOf('.js') !== -1;
  var type = isJavascriptFile ? 'tree' : 'blob';

  var path = getSourceFromDoclet(doclet, repoName);
  var linkBase = githubConfig.url + '/' + type + '/' + repoVersion + '/' + path;

  var url = linkBase + '/' + filename + (lineNumber ? '#L' + lineNumber : '');
  var linkText = shortPath + (lineNumber ? ', line ' + lineNumber : '');

  return '<a href="' + url + '" target="_blank">' + linkText + '</a>';
}

function generate(title, docs, filename, resolveLinks) {
  try {
    var html = renderContainer.call(view, {
      title: title,
      docs: docs
    });

    if (resolveLinks !== false) {
      html = helper.resolveLinks(html); // turn {@link foo} into <a href="foodoc.html">foo</a>
    }

    var outputPath = path.join(outputDir, filename);
    // fs.writeFileSync(outputPath, html, 'utf8');

    fs.writeFile(outputPath, html, 'utf8', function(error) {
      if (error) {
        console.log('[ERROR] Could not write file: ' + title + '\n');
      }

      // console.log('[INFO] Generated documentation for: ' + title + '\n')
    });

  } catch(error) {
    console.log('[ERROR] Could not generate documentation for: ' + title + '\n' + error + '\n');
  }
}

/**
 * Look for classes or functions with the same name as modules (which indicates that the module
 * exports only that class or function), then attach the classes or functions to the `module`
 * property of the appropriate module doclets. The name of each class or function is also updated
 * for display purposes. This function mutates the original arrays.
 *
 * @private
 * @param {Array.<module:jsdoc/doclet.Doclet>} doclets - The array of classes and functions to
 * check.
 * @param {Array.<module:jsdoc/doclet.Doclet>} modules - The array of module doclets to search.
 */
function attachModuleSymbols(doclets, modules) {
  var symbols = {};

  // build a lookup table
  doclets.forEach(function(symbol) {
    var longname = symbol.longname;

    symbols[longname] = symbols[longname] || [];
    symbols[longname].push(symbol);
  });

  return modules.map(function(module) {
    var moduleSymbols = symbols[module.longname];
    if (moduleSymbols) {
      module.modules = moduleSymbols
      // Only show symbols that have a description. Make an exception for classes, because
      // we want to show the constructor-signature heading no matter what.
        .filter(function(symbol) {
          return symbol.description || symbol.kind === docletUtils.KIND_CLASS;
        })
        .map(function(symbol) {
          symbol = doop(symbol);

          if (symbol.kind === docletUtils.KIND_CLASS || symbol.kind === docletUtils.KIND_FUNCTION) {
            symbol.name = symbol.name.replace('module:', '(require("') + '"))';
          }

          return symbol;
        });
    }
  });
}

function buildNavigationIndex(data) {
  function _searchMembers(kind, memberOf) {
    var searchSpec = {
      kind: kind,
      memberof: memberOf
    };

    var members = [];
    helper.find(data, searchSpec).forEach(function(member) {
      members.push(_getMemberData(member, kind));
    });

    return members;
  }

  function _getMemberData(member, kind) {
    var name = member.name;
    var longname = member.longname;

    var trimmedName = member.name != null ? member.name.replace(/"(.+)"/, '$1') : null;

    var memberSpec = {
      name: trimmedName,
      longname: longname,
      kind: kind
    };

    var hasPrefix = name !== longname;
    var prefix = hasPrefix ? longname.replace(name, '') : '';

    var isClass = kind === docletUtils.KIND_CLASS;
    var isEvent = kind === docletUtils.KIND_EVENT;
    var isNamespace = kind === docletUtils.KIND_NAMESPACE;

    if (isClass || isNamespace) {
      memberSpec.interfaces = _searchMembers(docletUtils.KIND_INTERFACE, longname);
      memberSpec.classes = _searchMembers(docletUtils.KIND_CLASS, longname);
      memberSpec.events = _searchMembers(docletUtils.KIND_EVENT, longname);
    }

    if (isNamespace) {
      memberSpec.title = prefix + pageUtils.strong(helper.linkto(longname, name));
    }

    if (isEvent) {
      var scope = member.scope;

      if (typeof scope === "string") {
        var replaceValue = null;

        if (scope === "static") {
          replaceValue = ".html#.event:";
        } else if(member.scope === "instance") {
          replaceValue = ".html#event:";
        }

        if (replaceValue != null) {
          var searchValue = "#event:";

          memberSpec.title = prefix
            .replace(searchValue, replaceValue)
            .replace(/\"/g, "_") + encodeURI(name);
        }
      }
    }

    return memberSpec;
  }

  function _buildMembers(members, title) {
    if (!docletUtils.canWriteValue(members)) {
      return "";
    }

    var content = pageUtils.li(title, {class: 'title'});

    members.forEach(function (member) {
      var title = member.title;
      var name = member.name;
      var longname = member.longname;

      content += pageUtils.ul(function () {
        var subListContent = pageUtils.li(function itemLink() {
          var isEvent = member.kind === docletUtils.KIND_EVENT;

          return isEvent ? pageUtils.a(name, {href: title}) : helper.linkto(longname, name);
        });

        var interfaces = member.interfaces;
        var classes = member.classes;
        var events = member.events;

        if (docletUtils.canWriteValue(interfaces)) {
          subListContent += _buildMembers(interfaces, 'Interfaces')
        }

        if (docletUtils.canWriteValue(classes)) {
          subListContent += _buildMembers(classes, 'Classes')
        }

        if (docletUtils.canWriteValue(events)) {
          subListContent += _buildMembers(events, 'Events')
        }

        return subListContent;
      });
    });

    return content;
  }

  function _buildToggleScript() {
    return pageUtils.script(function toggleScript() {
      return "\n$(\".index-nav button[id^='toggle_']\").click(function() {" +
             "\n  var $this = $(this);" +
             "\n  var index = $this.attr('id').replace('toggle_', '');" +
             "\n" +
             "\n  $this.toggleClass('mt-toggle-expand').toggleClass('mt-toggle-collapse');" +
             "\n  $('ul#namespace_' + index).toggleClass('namespace-collapsed').slideToggle();" +
             "\n});";
    });
  }

  // start building nav

  var members = _searchMembers(docletUtils.KIND_NAMESPACE);
  if (!docletUtils.canWriteValue(members)) {
    return "";
  }

  return pageUtils.ul(function indexList() {
    var listContent = '';

    members.forEach(function(namespace, index) {
      var namespaceTitle = namespace.title;

      listContent += pageUtils.li(function indexItem() {
        var itemContent = '';

        itemContent += pageUtils.button('', {
          id: 'toggle_' + index, class: 'mt-toggle-expand mt-toggle'
        });
        itemContent += pageUtils.span(namespaceTitle);
        itemContent += pageUtils.ul(function subList() {
          var interfaces = namespace.interfaces;
          var classes = namespace.classes;
          var events = namespace.events;

          var subListContent = '';
          if (docletUtils.canWriteValue(interfaces)) {
            subListContent += _buildMembers(interfaces, 'Interfaces')
          }

          if (docletUtils.canWriteValue(classes)) {
            subListContent += _buildMembers(classes, 'Classes')
          }

          if (docletUtils.canWriteValue(events)) {
            subListContent += _buildMembers(events, 'Events')
          }

          return subListContent;
        }, { class: 'namespace_' + index, style: 'display:none;' });

        return itemContent;
      }, { class: 'namespaceEntry' });
    });

    return listContent;
  }, { class: 'index-nav' }) + _buildToggleScript();
}

function registerTypeHelpers(view) {
  view._typeBuilder = typeBuilder;

  var mdnJsTypeBaseURL = "http://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/";
  var mdnJsWindowBaseURL = "https://developer.mozilla.org/en-US/docs/Web/API/Window/";
  var mdnJsTypes = {
    "string" : true,  "String": true,
    "number": true,   "Number": true,
    "boolean": true,  "Boolean": true,
    "array": true,    "Array": true,
    "object": true,   "Object": true,
    "function": true, "Function": true,
    "Date": true,     "Promise": true,
    "null": true,     "undefined": true,

    "RegExp": true,    "Reflect": true,
    "DataView": true,  "Intl": true,
    "Generator": true, "GeneratorFunction": true,
    "Proxy": true,     "JSON": true,

    "Error": true,      "EvalError": true,
    "TypeError": true,  "SyntaxError": true,
    "RangeError": true, "InternalError": true,
    "URIError": true,   "ReferenceError": true,

    "TypedArray": true,    "ArrayBuffer": true,
    "Float32Array": true,  "Float64Array": true,
    "Int8Array": true,     "Int32Array": true,
    "Inttrue6Array": true, "Uinttrue6Array": true,
    "Uint8Array": true,     "Uint8ClampedArray": true,
    "Uint32Array": true,

    "Map": true, "WeakMap": true,
    "Set": true, "WeakSet": true,
    "Math": true, "Symbol": true
  };

  var mdnJsWindow = {
    "URL": true
  };

  var backboneTypeBaseURL = "http://backbonejs.org/#";
  var jQueryTypes = {
    "jquery": "jQuery",
    "selector": "Selector"
  };
  var jQueryTypeBaseURL = "http://api.jquery.com/Types/#";

  var modifiers = "[?!]?";
  var left_p = "\\(?";
  var right_p = "\\)?";
  var remainder = "$|(?:[|,]\\s*)(.+)";
  var complexProps = "[<(?!\\w|,. )>]+";
  var BACKBONE_TYPE_REGX = /backbone\.([a-z]+)/i;

  // regx: /([?!]?)([\w.*]+)(?:())?/
  //
  // Examples:
  // input: "Object"
  // match: [ input, '', 'Object' ]
  //
  // input: "!Object"
  // match: [ input, '!', 'Object' ]
  //
  // input: "Object.<Boolean>"
  // match: null
  var SIMPLE_TYPE_REGX = new RegExp("(" + modifiers + ")([\\w.*]+)(?:\\(\\))?");

  // regx: /^(?:([?!]?)([\w.]+))\.<([<(?!\w|,. )>]+)>/
  //
  // Examples:
  // input: "Array"
  // match: null;
  //
  // input: "!Array.<Object>"
  // match: [ input, '!', 'Array', 'Object' ]
  //
  // input: "Class.<Object.<String, Date>, Boolean>"
  // match: [ input, '', 'Class', 'Object.<String, Date>, Boolean' ]
  var COMPLEX_TYPE_REGX = new RegExp("^(?:(" + modifiers + ")([\\w.]+))\\.<(" + complexProps + ")>");
  var TYPE_MODIFIER = 1;
  var TYPE_NAME = 2;
  var COMPLEX_TYPE_PROPS = 3;

  // regx: /(\(?(?:[\w|.*!?]+)\)?(?:\.<(?:[<(?!\w|,. )>]+)>)?)(?:$|(?:[|,]\s*)(.+))/
  //
  // Examples:
  // input: "Object.<String, Date>, Boolean, Date, Class.<Function>"
  // match: [ input, 'Object.<String, Date>', 'Date, Class.<Function>' ]
  //
  // input: "Boolean, Date, Class.<Function>"
  // match: [ input, 'Boolean', 'Date, Class.<Function>' ]
  //
  // input: "Date, Class.<Function>"
  // match: [ input, 'Date', 'Class.<Function>' ]
  //
  // input: "Class.<Function>"
  // match: [ input, 'Class.<Function>', undefined ]
  var C_PROPS_RECURSIVE_REGX = new RegExp(
      "(" + left_p + "(?:[\\w|.*!?]+)" + right_p +
      "(?:\\.<(?:" + complexProps + ")>)?)" +
      "(?:" + remainder + ")"
  );
  var C_PROPS_RECURSIVE_FIRST = 1;
  var C_PROPS_RECURSIVE_REMAINDER = 2;

  // regx: /\(((?:.|\|)+)\)/
  //
  // Examples:
  // input: "( String | pentaho.type.Instance | Promise )"
  // match: [ input, 'String | pentaho.type.Instance | Promise' ]
  var MULTIPLE_OR_TYPE_REGX = new RegExp("\\(((?:.|\\|)+)\\)");
  var MULTIPLE_OR_TYPES = 1;

  // -------

  /**
   * Build a type documentation link by checking if it is a simple or complex type declaration
   * and for the later, try to build recursively other type declarations nested inside.
   * @example Simple Type:
   * `Boolean -> `<code><a href="link/to/Boolean">Boolean</a></code>`
   *
   * @example Complex Type:
   * `Object.&lt;Date, String&gt;` -> `<code>
   *                                     <a href="link/to/Object">Object</a>.&lt;
   *                                     <code><a href="link/to/Date">Date</a></code>,
   *                                     <code><a href="link/to/String">String</a></code>&gt;
   *                                   </code>`
   *
   * @example Complex Nested:
   * `Object.&lt;Class.&lt;String&gt;&gt;` -> `<code>
   *                                             <a href="link/to/Object">Object</a>.&lt;
   *                                             <code>
   *                                               <a href="link/to/Class">Class</a>.&lt;
   *                                               <code><a href="link/to/String">String</a></code>&gt;
   *                                             </code>&gt;
   *                                           </code>`
   *
   * @param {String} name       - The type name.
   * @param {Number} [index]    - The type position in the data array
   * @param {Number} [dataSize] - The data array size.
   *
   * @return {String} the html with links for the type declaration.
   */
  function typeBuilder(name, index, dataSize) {
    // check if it is an array type
    var jsType = name;
    var complexType = COMPLEX_TYPE_REGX.exec(name);

    var complexTypeProps = null;
    var prefix;
    if (complexType !== null) {
      prefix = complexType[TYPE_MODIFIER];
      jsType = complexType[TYPE_NAME];
      complexTypeProps = complexType[COMPLEX_TYPE_PROPS];
    } else {
      var simpleType = SIMPLE_TYPE_REGX.exec(name);
      prefix = simpleType[TYPE_MODIFIER];
      jsType = simpleType[TYPE_NAME];
    }

    var separator = index != null && index < dataSize - 1 ? " | " : "";
    return buildLink(prefix, jsType, complexTypeProps) + separator;
  }

  /**
   * Parse the properties that are nested inside a complex type declaration
   * and build each nested type documentation link.
   *
   * @param {String} complexTypeProps - The complex type nested properties.
   *
   * @return {String} the html with links for the type declaration.
   */
  function parseComplexTypeProps(complexTypeProps) {
    var result = "";
    if (!complexTypeProps) return result;

    var isFinished = false;
    var recursiveMatch;
    while (!isFinished && (recursiveMatch = C_PROPS_RECURSIVE_REGX.exec(complexTypeProps)) != null) {
      var firstType = recursiveMatch[C_PROPS_RECURSIVE_FIRST];
      complexTypeProps = recursiveMatch[C_PROPS_RECURSIVE_REMAINDER];

      var multipleOrTypes = MULTIPLE_OR_TYPE_REGX.exec(firstType);
      if (multipleOrTypes != null) {
        var html = "";
        var multipleArray = multipleOrTypes[MULTIPLE_OR_TYPES].split("|");
        var dataSize = multipleArray.length;

        multipleArray.forEach(function (name, index) {
          html += typeBuilder(name, index, dataSize);
        });

        result += "(" + html + ")";
      } else {
        result += typeBuilder(firstType);
      }

      isFinished = complexTypeProps == null;
      if (!isFinished) result += ", ";
    }

    return result;
  }

  function buildLink(prefix, jsType, complexTypeProps) {
    var typeLinkInfo = getLinkInfo(jsType);

    var safeHtml = helper.htmlsafe(prefix + typeLinkInfo.jsType);
    var jsTypeLink = helper.linkto(typeLinkInfo.link, safeHtml);

    if (complexTypeProps != null) {
      return "<code>" + jsTypeLink + ".&lt;" + parseComplexTypeProps(complexTypeProps) + "&gt;</code>";
    } else {
      return "<code>" + jsTypeLink + "</code>";
    }
  }

  /**
   * Gets the link for a single type.
   * The type might be changed inside so we return it was well
   *
   * @param {String} jsType - The type name.
   *
   * @return {{String, String}} the type name and the documentation link.
   */
  function getLinkInfo(jsType) {
    var jsTypeLower = jsType.toLowerCase();

    var isMdnJsType = mdnJsTypes[jsType];
    var isMdnJsWindow = mdnJsWindow[jsType];
    var isJQueryType = typeof jQueryTypes[jsTypeLower] !== "undefined";
    var isBackboneType = BACKBONE_TYPE_REGX.exec(jsType) !== null;

    var link;
    if (isMdnJsType) {
      link = mdnJsTypeBaseURL + jsType;

    } else if(isMdnJsWindow) {
      link = mdnJsWindowBaseURL + jsType;

    } else if (isBackboneType) {
      link = backboneTypeBaseURL + jsType.split(".")[1];

    } else if (isJQueryType) {
      jsType = jQueryTypes[jsTypeLower];
      link = jQueryTypeBaseURL + jsType;

    } else { // CTools or unknown type, output its value
      link = jsType;
    }

    return {
      jsType: jsType,
      link: link
    }
  }

}

/**
    @param {TAFFY} taffyData See <http://taffydb.com/>.
    @param {object} opts
    @param {Tutorial} tutorials
 */
exports.publish = function(taffyData, opts, tutorials) {
  data = taffyData;

  var _find = function(spec) {
    return helper.find(data, spec);
  };

  var conf = env.conf.templates || {};
  conf.default = conf.default || {};

  var templatePath = path.normalize(opts.template);
  view = new template.Template(path.join(templatePath, 'tmpl'));

  // TODO move to generic page?
  //This will create all the type links for the template
  registerTypeHelpers(view);

  // claim some special filenames in advance, so the All-Powerful Overseer of Filename Uniqueness
  // doesn't try to hand them out later
  var indexUrl = helper.getUniqueFilename('index');
  // don't call registerLink() on this one! 'index' is also a valid longname

  var globalUrl = helper.getUniqueFilename('global');
  helper.registerLink('global', globalUrl);

  // set up templating
  // view.layout = opts.layoutFile;

  // set up tutorials for helper
  helper.setTutorials(tutorials);

  data = helper.prune(data);
  data.sort('longname, version, since');

  helper.addEventListeners(data);

  var sourceFiles = {};
  var sourceFilePaths = [];

  function _hashToLink(doclet, hash) {
    if (!/^(#.+)/.test(hash)) {
      return hash;
    }

    var url = helper.createLink(doclet).replace(/(#.+|$)/, hash);

    return pageUtils.a(hash, { href: url });
  }

  data().each(function(doclet) {
        doclet.attribs = '';

        if (doclet.examples) {
            doclet.examples = doclet.examples.map(function(example) {
                var caption, code;

                if (example.match(/^\s*<caption>([\s\S]+?)<\/caption>(\s*[\n\r])([\s\S]+)$/i)) {
                    caption = RegExp.$1;
                    code = RegExp.$3;
                }

                return {
                    caption: caption || '',
                    code: code || example
                };
            });
        }
        if (doclet.codeExamples) {
            doclet.codeExamples = doclet.codeExamples.map(function(codeExample) {
                var caption, code;

                if (codeExample.match(/^\s*<caption>([\s\S]+?)<\/caption>(\s*[\n\r])([\s\S]+)$/i)) {
                    caption = RegExp.$1;
                    code = RegExp.$3;
                }

                return {
                    caption: caption || '',
                    code: code || codeExample
                };
            });
        }
        if (doclet.see) {
            doclet.see.forEach(function(seeItem, i) {
                doclet.see[i] = _hashToLink(doclet, seeItem);
            });
        }

        // build a list of source files
        var sourcePath;
        if (doclet.meta) {
            sourcePath = getPathFromDoclet(doclet);
            sourceFiles[sourcePath] = {
                resolved: sourcePath,
                shortened: null
            };
            if (sourceFilePaths.indexOf(sourcePath) === -1) {
                sourceFilePaths.push(sourcePath);
            }
        }
    }); // EACH #1

  /*
   * Handle the defaul values for non optional properties correctly.
   *
   */
  data().each(function(doclet) {
      if (doclet.properties) {
          doclet.properties = doclet.properties.map(function(property) {
              var separator = " - ",
                  separatorLength = separator.length;

              var defaultvalue = property.defaultvalue;
              var description = property.description;

              if( property.defaultvalue !== 'undefined' && !property.optional && description.indexOf(separator) > 0) {
                  var index = description.indexOf(separator);
                  defaultvalue += " " + description.substr(separatorLength, index-separatorLength);
                  description = "<p>" + description.substr(index + separatorLength, description.length);
              }

              return {
                  defaultvalue: defaultvalue,
                  description: description,
                  type: property.type,
                  name: property.name
              }
          });
      }
  }); // EACH #2

  // update outputDir if necessary, then create outputDir
  var packageInfo = ( helper.find(data, {kind: 'package'}) || [] ) [0];
  if (packageInfo && packageInfo.name) {
    outputDir = path.join(outputDir, packageInfo.name, (packageInfo.version || ''));
  }

  fs.mkPath(outputDir);

  // copy the template's static files to outputDir
  var fromDir = path.join(templatePath, 'static');
  var staticFiles = fs.ls(fromDir, 3);

  staticFiles.forEach(function(fileName) {
    var toDir = fs.toDir( fileName.replace(fromDir, outputDir));

    fs.mkPath(toDir);
    fs.copyFileSync(fileName, toDir);
  });

  // copy user-specified static files to outputDir
  var staticFilePaths;
  var staticFileFilter;
  var staticFileScanner;
  if (conf.default.staticFiles) {
    // The canonical property name is `include`. We accept `paths` for backwards compatibility
    // with a bug in JSDoc 3.2.x.
    staticFilePaths = conf.default.staticFiles.include ||
      conf.default.staticFiles.paths || [];

    staticFileFilter = new (require('jsdoc/src/filter')).Filter(conf.default.staticFiles);
    staticFileScanner = new (require('jsdoc/src/scanner')).Scanner();

    staticFilePaths.forEach(function(filePath) {
      var extraStaticFiles;

      filePath = path.resolve(env.pwd, filePath);
      extraStaticFiles = staticFileScanner.scan([filePath], 10, staticFileFilter);

      extraStaticFiles.forEach(function(fileName) {
        var sourcePath = fs.toDir(filePath);
        var toDir = fs.toDir( fileName.replace(sourcePath, outputDir));

        fs.mkPath(toDir);
        fs.copyFileSync(fileName, toDir);
      });
    });
  }

  if (sourceFilePaths.length) {
    sourceFiles = shortenPaths(sourceFiles, path.commonPrefix(sourceFilePaths));
  }

  data().each(function(doclet) {
      var url = helper.createLink(doclet);
      helper.registerLink(doclet.longname, url);

      // add a shortened version of the full path
      var docletPath;
      if (doclet.meta) {
          docletPath = getPathFromDoclet(doclet);
          docletPath = sourceFiles[docletPath].shortened;
          if (docletPath) {
              doclet.meta.shortpath = docletPath;
          }
      }

      var sourceLink;
      if (doclet.meta) {
          sourceLink = getLinkFromDoclet(doclet);
          doclet.meta.sourceLink = sourceLink;
      }
  }); // EACH #3

  data().each(function(doclet) {
      var url = helper.longnameToUrl[doclet.longname];

      if (url.indexOf('#') > -1) {
          doclet.id = helper.longnameToUrl[doclet.longname].split(/#/).pop();
      }
      else {
          doclet.id = doclet.name;
      }

      if ( needsSignature(doclet) ) {
          addSignatureParams(doclet);
          //addSignatureReturns(doclet);
          addAttribs(doclet);
      }
  }); // EACH #4

  // do this after the urls have all been generated
  data().each(function(doclet) {
    doclet.ancestors = helper.getAncestorLinks(data, doclet);

    if (doclet.kind === 'member') {
      addSignatureTypes(doclet);
      addAttribs(doclet);
    }

    if (doclet.kind === 'constant') {
      addSignatureTypes(doclet);
      addAttribs(doclet);

      doclet.kind = 'member';
      doclet.constant = true;
    }
  }); // EACH #5

  data().each(function(doclet) {
      if(!doclet.ignore) {
          var parent = helper.find(data, {longname: doclet.memberof})[0];
          if( !parent ) {
              doclet.scopeEf = doclet.scope;
          } else {
              if(doclet.scope === 'static' && parent.kind !== 'class') {
                  doclet.scopeEf = 'instance';
              } else if(doclet.scope === 'static' && parent.static && parent.kind === 'class') {
                  doclet.scopeEf = 'instance';
              } else {
                  doclet.scopeEf = doclet.scope;
              }
          }
      }
  }); // EACH #6

  // handle summary, description and class description default values properly
  data().each(function(doclet) {
      if(!doclet.ignore) {
          var checkP = function(prop) {
              if (!prop) return;
              var START_P = "<p>";
              var END_P   = "</p>";

              prop = prop.replace(/<p><p>/g, START_P);

              if (prop.indexOf(START_P) === -1) {
                  return START_P + prop + END_P;
              }

              return prop;
          };

          var replaceCode = function(string) {
              if(!string) return;
              var flip = true;
              var idx = string.indexOf("`");
              while(idx > -1) {
                string = string.substr(0, idx) + (flip ? "<code>" : "</code>") + string.substr(idx + 1);
                flip = !flip;
                idx = string.indexOf("`");
              }
              return string;
          };

          if ( doclet.kind === "class" ) {
            doclet.classSummary = replaceCode(checkP(doclet.classSummary));
            doclet.constructorSummary = replaceCode(checkP(doclet.constructorSummary));
          }

          doclet.summary = replaceCode(checkP(doclet.summary));
          doclet.description = replaceCode(checkP(doclet.description));
          doclet.classdesc = replaceCode(checkP(doclet.classdesc));
      }
  }); // EACH #7

  //handle splits and joins on names
  data().each(function(doclet) {
      if(!doclet.ignore) {
          var split = function(str, sep) {
              if(str) {
                  return str.split(sep).join('');
              }
          };

          //dont split for code
          if(doclet.description && doclet.description.indexOf("syntax.javascript") === -1) {
              doclet.description = split(doclet.description, '<br>');
          }
          if(doclet.description && doclet.description.indexOf("syntax.text") === -1) {
              doclet.description = split(doclet.description, '<br>');
          }
          if(doclet.classdesc && doclet.classdesc.indexOf("syntax.javascript") === -1) {
              doclet.classdesc = split(doclet.classdesc, '<br>');
          }
          if(doclet.summary && doclet.summary.indexOf("syntax.javascript") === -1) {
              doclet.summary = split(doclet.summary, '<br>');
          }

          doclet.parsedName = split(doclet.name, '"');
          doclet.parsedLongname = split(doclet.longname, '"')
      }
  }); // EACH #8

  var members = helper.getMembers(data);
  members.tutorials = tutorials.children;

  // add template helpers
  view.find = _find;
  view.linkto = helper.linkto;
  view.resolveAuthorLinks = resolveAuthorLinks;
  view.tutoriallink = docletUtils.tutorialLink;
  view.htmlsafe = htmlsafe;

  // once for all
  view.nav = buildNavigationIndex(data, docletUtils.KIND_NAMESPACE);

  attachModuleSymbols(helper.find(data, { longname: { left: 'module:' } }), members.modules);

  if (members.globals.length) {
    var globalDoclet = [{kind: 'globalobj'}];
    generate('Global', globalDoclet, globalUrl, outputDir);
  }

  // index page displays information from package.json and lists files
  var files = helper.find(data, {kind: 'file'});
  var packages = helper.find(data, {kind: 'package'});

  var homeDoclets = packages.concat([{
    kind: 'mainpage',
    readme: opts.readme,
    longname: (opts.mainpagetitle) ? opts.mainpagetitle : 'Main Page'
  }]).concat(files);

  generate('Home', homeDoclets, indexUrl, outputDir);

  // set up the lists that we'll use to generate pages
  var classes = taffy(members.classes);
  var modules = taffy(members.modules);
  var namespaces = taffy(members.namespaces);
  var mixins = taffy(members.mixins);
  var externals = taffy(members.externals);
  var interfaces = taffy(members.interfaces);

  Object.keys(helper.longnameToUrl).forEach(function(longname) {
    var findSpec = { longname: longname };
    var filename = helper.longnameToUrl[longname];

    var myModules = helper.find(modules, findSpec);
    if (myModules.length > 0) {
      var moduleTitle = 'Module: ' + myModules[0].name;

      generate(moduleTitle, myModules, filename/*, outdir*/);
    }

    var myClasses = helper.find(classes, findSpec);
    if (myClasses.length > 0) {
      var classTitle = 'Class: ' + myClasses[0].name;

      generate(classTitle, myClasses, filename/*, outdir*/);
    }

    var myNamespaces = helper.find(namespaces, findSpec);
    if (myNamespaces.length > 0) {
      var namespaceTitle = 'Namespace: ' + myNamespaces[0].name;

      generate(namespaceTitle, myNamespaces, filename/*, outdir*/);
    }

    var myMixins = helper.find(mixins, findSpec);
    if (myMixins.length > 0) {
      var mixinTitle = 'Mixin: ' + myMixins[0].name;

      generate(mixinTitle, myMixins, filename/*, outdir*/);
    }

    var myExternals = helper.find(externals, findSpec);
    if (myExternals.length > 0) {
      var externalTitle = 'External: ' + myExternals[0].name;

      generate(externalTitle, myExternals, filename/*, outdir*/);
    }

    var myInterfaces = helper.find(interfaces, findSpec);
    if (myInterfaces.length > 0) {
      var interfaceTitle = 'Interface: ' + myInterfaces[0].name;

      generate(interfaceTitle, myInterfaces, filename/*, outdir*/);
    }
  });

  // TODO: move the tutorial functions to templateHelper.js
  function generateTutorial(title, tutorial, filename) {
    var tutorialData = {
      title: title,
      header: tutorial.title,
      content: tutorial.parse(),
      children: tutorial.children
    };

    var tutorialPath = path.join(outputDir, filename);
    var html = view.render('tutorial.tmpl', tutorialData);

    // yes, you can use {@link} in tutorials too!
    html = helper.resolveLinks(html); // turn {@link foo} into <a href="foodoc.html">foo</a>

    fs.writeFileSync(tutorialPath, html, 'utf8');
  }

  // tutorials can have only one parent so there is no risk for loops
  function saveChildren(node) {
    node.children.forEach(function(child) {
      generateTutorial('Tutorial: ' + child.title, child, helper.tutorialToUrl(child.name));

      saveChildren(child);
    });
  }

  saveChildren(tutorials);
};
