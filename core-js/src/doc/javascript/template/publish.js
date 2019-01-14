/* global env: true */

'use strict';

var View = require('./View');
var docletUtils = require('./tmpl/doclet/utils');
var githubConfig = require('./github.config')();

var doop = require('jsdoc/util/doop');
var fs = require('jsdoc/fs');
var path = require('jsdoc/path');
var taffy = require('taffydb').taffy;

var helper = docletUtils.helper;

function shortenPaths(files, filePaths) {
  var commonPrefix = path.commonPrefix(filePaths);

  Object.keys(files).forEach(function(filename) {
    var file = files[filename];

    file.shortened = file.resolved.replace(commonPrefix, '')
      // always use forward slashes
      .replace(/\\/g, '/');
  });

  return files;
}

function createOutputDirectory(data, outputDir) {
  var packageInfo = helper.find(data, {
    kind: 'package'
  })[0];

  var name = packageInfo && packageInfo.name;
  var version = packageInfo.version || '';

  // update outputDir if necessary, then create outputDir
  if (name != null) {
    outputDir = path.join(outputDir, name, version);
  }

  fs.mkPath(outputDir);

  return outputDir;
}

function copyStaticFiles(templatePath, defaultStaticFiles, outputDir) {
  // copy the template's static files to outputDir
  var staticFilesPath = path.join(templatePath, 'static');

  var staticFiles = fs.ls(staticFilesPath, 3);
  staticFiles.forEach(function(fileName) {
    var toDir = fs.toDir(fileName.replace(staticFilesPath, outputDir));

    fs.mkPath(toDir);
    fs.copyFileSync(fileName, toDir);
  });

  // copy user-specified static files to outputDir
  if (defaultStaticFiles != null) {
    // The canonical property name is `include`. We accept `paths` for backwards compatibility with a bug in JSDoc 3.2.x.
    var staticFilePaths = defaultStaticFiles.include || defaultStaticFiles.paths || [];
    var staticFileFilter = new (require('jsdoc/src/filter')).Filter(defaultStaticFiles);
    var staticFileScanner = new (require('jsdoc/src/scanner')).Scanner();

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
}

/**
 * Look for classes or functions with the same name as modules (which indicates that the module
 * exports only that class or function), then attach the classes or functions to the `module`
 * property of the appropriate module doclets. The name of each class or function is also updated
 * for display purposes. This function mutates the original arrays.
 *
 * @private
 * @param {Array.<module:jsdoc/doclet.Doclet>} data - The array of classes and functions to
 * check.
 * @param {Array.<module:jsdoc/doclet.Doclet>} modules - The array of module doclets to search.
 */
function attachModuleSymbols(data, modules) {
  var doclets = helper.find(data, { longname: { left: 'module:' } });

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

/**
    @param {TAFFY} taffyData See <http://taffydb.com/>.
    @param {object} opts
    @param {Tutorial} tutorials
 */
exports.publish = function(taffyData, opts, tutorials) {
  var data = taffyData;

  var conf = env.conf.templates || {};
  conf.default = conf.default || {};

  var outputDir = path.normalize(env.opts.destination);
  var templatePath = path.normalize(opts.template);

  // claim some special filenames in advance, so the All-Powerful Overseer of Filename Uniqueness
  // doesn't try to hand them out later. don't call registerLink() on this one! 'index' is also a valid longname
  var indexUrl = helper.getUniqueFilename('index');
  //

  var globalUrl = helper.getUniqueFilename('global');
  helper.registerLink('global', globalUrl);

  // set up tutorials for helper
  helper.setTutorials(tutorials);

  data = helper.prune(data);
  data.sort('longname, version, since');

  helper.addEventListeners(data);

  var sourceFiles = {};
  var sourceFilePaths = [];

  data().each(function(doclet) {
    doclet.attribs = '';

    doclet.examples = docletUtils.getExamples(doclet);
    doclet.codeExamples = docletUtils.getCodeExamples(doclet);
    doclet.see = docletUtils.getSeeLinks(doclet);

    if (doclet.meta) { // build a list of source files
      var sourcePath = docletUtils.getSourcePath(doclet);

      sourceFiles[sourcePath] = { resolved: sourcePath, shortened: null };

      if (sourceFilePaths.indexOf(sourcePath) === -1) {
        sourceFilePaths.push(sourcePath);
      }
    }
  }); // EACH #1

  /*
   * Handle the default values for non optional properties correctly.
   */
  data().each(function(doclet) {
    doclet.properties = docletUtils.getProperties(doclet);
  }); // EACH #2

  outputDir = createOutputDirectory(data, outputDir);

  copyStaticFiles(templatePath, conf.default.staticFiles, outputDir);

  if (sourceFilePaths.length) {
    sourceFiles = shortenPaths(sourceFiles, sourceFilePaths);
  }

  data().each(function(doclet) {
    var url = helper.createLink(doclet);

    helper.registerLink(doclet.longname, url);

    var meta = doclet.meta;
    if (meta != null) {
      var docletPath = docletUtils.getSourcePath(doclet);

      // add a shortened version of the full path
      docletPath = sourceFiles[docletPath].shortened;
      if (docletPath) {
        doclet.meta.shortpath = docletPath;
      }

      doclet.meta.sourceLink = githubConfig.getSourceLink(doclet);
    }
  }); // EACH #3

  data().each(function(doclet) {
    var url = helper.longnameToUrl[doclet.longname];

    doclet.id = url.indexOf('#') > -1 ? url.split(/#/).pop() : doclet.name;

    if (docletUtils.needSignature(doclet)) {
      doclet.signature = docletUtils.getSignatureWithParameters(doclet);
      doclet.attribs = docletUtils.getAttributes(doclet);
    }
  }); // EACH #4

  // do this after the urls have all been generated
  data().each(function(doclet) {
    doclet.ancestors = helper.getAncestorLinks(data, doclet);

    var isConstant = doclet.kind === docletUtils.KIND_CONSTANT;
    if (isConstant) {
      doclet.kind = docletUtils.KIND_MEMBER;
      doclet.constant = true;
    }

    var isMember = doclet.kind === docletUtils.KIND_MEMBER;
    if (isMember) {
      doclet.signature = docletUtils.getSignatureWithTypes(doclet);
      doclet.attribs = docletUtils.getAttributes(doclet);
    }
  }); // EACH #5

  var splitAndJoin = function(value, sep) {
    if (value == null) {
      return value;
    }

    return value.split(sep).join('');
  };

  function getScopeEf(doclet) {
    var scope = doclet.scope;

    var isStaticScope = scope === 'static';
    var parent = helper.find(data, {
      longname: doclet.memberof
    })[0];

    if (parent != null && isStaticScope) {
      var isParentClass = parent.kind === docletUtils.KIND_CLASS;

      if (!isParentClass || (parent.static && isParentClass)) {
        scope = 'instance';
      }
    }

    return scope;
  }

  data().each(function(doclet) {
    if(!doclet.ignore) {
      doclet.scopeEf = getScopeEf(doclet);

      // -----

      if (doclet.kind === docletUtils.KIND_CLASS) {
        doclet.classSummary = docletUtils.checkParagraph(doclet, 'classSummary');
        doclet.constructorSummary = docletUtils.checkParagraph(doclet, 'constructorSummary');
      }

      doclet.summary = docletUtils.checkParagraph(doclet, 'summary');
      doclet.description = docletUtils.checkParagraph(doclet, 'description');
      doclet.classdesc = docletUtils.checkParagraph(doclet, 'classdesc');

      // -----

      var description = doclet.description;
      if (!/syntax\.(javascript|text)/.test(description)) {
        doclet.description = splitAndJoin(description, '<br>');
      }

      var classDescription = doclet.classdesc;
      if (!/syntax\.javascript/.test(classDescription)) {
        doclet.classdesc = splitAndJoin(classDescription, '<br>');
      }

      var summary = doclet.summary;
      if(!/syntax\.javascript/.test(summary)) {
        doclet.summary = splitAndJoin(summary, '<br>');
      }

      doclet.parsedName = splitAndJoin(doclet.name, '"');
      doclet.parsedLongname = splitAndJoin(doclet.longname, '"')
    }
  }); // EACH #6

  // handle summary, description and class description default values properly
  // data().each(function(doclet) {
  //   if(!doclet.ignore) {
  //     if (doclet.kind === docletUtils.KIND_CLASS) {
  //       doclet.classSummary = docletUtils.checkParagraph(doclet, 'classSummary');
  //       doclet.constructorSummary = docletUtils.checkParagraph(doclet, 'constructorSummary');
  //     }
  //
  //     doclet.summary = docletUtils.checkParagraph(doclet, 'summary');
  //     doclet.description = docletUtils.checkParagraph(doclet, 'description');
  //     doclet.classdesc = docletUtils.checkParagraph(doclet, 'classdesc');
  //   }
  // }); // EACH #7

  //handle splits and joins on names
  // data().each(function(doclet) {
  //   if (!doclet.ignore) { // dont split for code
  //     var description = doclet.description;
  //     if (!/syntax\.(javascript|text)/.test(description)) {
  //       doclet.description = splitAndJoin(description, '<br>');
  //     }
  //
  //     var classDescription = doclet.classdesc;
  //     if (!/syntax\.javascript/.test(classDescription)) {
  //       doclet.classdesc = splitAndJoin(classDescription, '<br>');
  //     }
  //
  //     var summary = doclet.summary;
  //     if(!/syntax\.javascript/.test(summary)) {
  //       doclet.summary = splitAndJoin(summary, '<br>');
  //     }
  //
  //     doclet.parsedName = splitAndJoin(doclet.name, '"');
  //     doclet.parsedLongname = splitAndJoin(doclet.longname, '"')
  //   }
  // }); // EACH #8

  var members = helper.getMembers(data);
  members.tutorials = tutorials.children;

  var view = View(data, templatePath);

  attachModuleSymbols(data, members.modules);

  var globalOutputPath = path.join(outputDir, globalUrl);
  view.generateGlobal(members, globalOutputPath);

  var indexOutputPath = path.join(outputDir, indexUrl);
  view.generateHome(opts, indexOutputPath);

  // set up the lists that we'll use to generate pages
  var namespaces = taffy(members.namespaces);
  var interfaces = taffy(members.interfaces);
  var classes = taffy(members.classes);
  var modules = taffy(members.modules);
  var mixins = taffy(members.mixins);
  var externals = taffy(members.externals);

  var longnameToUrl = helper.longnameToUrl;
  Object.keys(longnameToUrl).forEach(function(longname) {
    var findSpec = { longname: longname };
    var outputPath = path.join(outputDir, longnameToUrl[longname]);

    var myModules = helper.find(modules, findSpec);
    if (myModules.length > 0) {
      var moduleTitle = 'Module: ' + myModules[0].name;

      view.generate(moduleTitle, myModules, outputPath);
    }

    var myClasses = helper.find(classes, findSpec);
    if (myClasses.length > 0) {
      var classTitle = 'Class: ' + myClasses[0].name;

      view.generate(classTitle, myClasses, outputPath);
    }

    var myNamespaces = helper.find(namespaces, findSpec);
    if (myNamespaces.length > 0) {
      var namespaceTitle = 'Namespace: ' + myNamespaces[0].name;

      view.generate(namespaceTitle, myNamespaces, outputPath);
    }

    var myMixins = helper.find(mixins, findSpec);
    if (myMixins.length > 0) {
      var mixinTitle = 'Mixin: ' + myMixins[0].name;

      view.generate(mixinTitle, myMixins, outputPath);
    }

    var myExternals = helper.find(externals, findSpec);
    if (myExternals.length > 0) {
      var externalTitle = 'External: ' + myExternals[0].name;

      view.generate(externalTitle, myExternals, outputPath);
    }

    var myInterfaces = helper.find(interfaces, findSpec);
    if (myInterfaces.length > 0) {
      var interfaceTitle = 'Interface: ' + myInterfaces[0].name;

      view.generate(interfaceTitle, myInterfaces, outputPath);
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
