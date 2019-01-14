/* global env: true, module: true */

'use strict';

module.exports = function() {
  var githubConfig = env.opts.githubConfig;
  if (githubConfig == null) {
    githubConfig = env.opts.githubConfig = {};
  }

  var BASE_URL = "https://github.com";
  var DEFAULT_COMPANY = "pentaho";
  var DEFAULT_BRANCH = "master";

  return {
    /**
     *
     */
    __config: githubConfig,

    get name() {
      var name = this.__config.name;
      if (name != null) {
        return name;
      }

      var url = this.__config.url;
      if (url != null) {
        url = url.replace(/(^\/|\/$)/, '');

        var lastSlash = url.lastIndexOf('/');

        name = this.__config.name = lastSlash !== -1 ? url.substring(lastSlash, url.length) : url;
      }

      return name;
    },

    get company() {
      var company = this.__config.company;
      if (company == null) {
        company = this.__config.company = DEFAULT_COMPANY;
      }

      return company;
    },

    get branch() {
      var branch = this.__config.branch;
      if (branch == null) {
        branch = this.__config.branch = DEFAULT_BRANCH;
      }

      return branch;
    },

    get url() {
      var url = this.__config.url;
      if (url == null) {
        url = this.__config.url = BASE_URL + "/" + this.company + "/" + this.name;
      }

      return url.replace(/\/$/, '');
    },

    getSourceLink: function(doclet) {
      var meta = doclet.meta;
      if (meta == null) {
        return meta;
      }

      var filename = meta.filename;
      var shortPath = meta.shortpath;
      var lineNumber = meta.lineno;

      var repoName = this.name;
      var repoVersion = this.branch;

      var isJavascriptFile = shortPath && shortPath.indexOf('.js') !== -1;
      var type = isJavascriptFile ? 'tree' : 'blob';

      var path = _getGitSourcePath(doclet, repoName);
      var linkBase = this.url + '/' + type + '/' + repoVersion + '/' + path;

      var url = linkBase + '/' + filename + (lineNumber ? '#L' + lineNumber : '');
      var linkText = shortPath + (lineNumber ? ', line ' + lineNumber : '');

      return '<a href="' + url + '" target="_blank">' + linkText + '</a>';
    }
  }
};

function _getGitSourcePath(doclet, gitRepoName) {
  var path = doclet.meta.path.replace(/\\/g,"/");
  var pathLength = path.length;

  var nameLength = gitRepoName ? gitRepoName.length : 0;
  var nameIndexOf = gitRepoName ? path.indexOf(gitRepoName) + 1 : 0;

  return path.substring(nameIndexOf + nameLength, pathLength);
}
