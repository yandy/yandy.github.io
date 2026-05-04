'use strict';
const path = require('path');

function buildSourceToUrl(hexo) {
  const posts = hexo.locals.get('posts');
  if (!posts || !posts.length) return null;

  const sourceToUrl = {};
  const root = hexo.config.root || '/';

  posts.forEach(function(post) {
    let url = post.path;
    url = url.replace(/\/?index\.html$/, '/');
    sourceToUrl[post.source] = root + url;
  });

  return sourceToUrl;
}

function resolveMdLinks(text, currentDir, sourceToUrl) {
  return text.replace(
    /\[([^\]]*)\]\(([^)]*\.md(?:#[^)]*)?)\)/g,
    function(match, text, href) {
      const m = href.match(/^([^#]*)(#.*)?$/);
      const linkPath = m[1];
      const fragment = m[2] || '';

      const resolved = path.posix.resolve('/', currentDir, linkPath).substring(1);

      if (sourceToUrl[resolved]) {
        return '[' + text + '](' + sourceToUrl[resolved] + fragment + ')';
      }

      return match;
    }
  );
}

// Primary: resolve markdown links before rendering (covers pages, feeds, etc.)
hexo.extend.filter.register('before_post_render', function(data) {
  if (!data.content || !data.source) return data;

  const sourceToUrl = buildSourceToUrl(this);
  if (!sourceToUrl) return data;

  const currentDir = path.dirname(data.source);
  data.content = resolveMdLinks(data.content, currentDir, sourceToUrl);
  data.excerpt = resolveMdLinks(data.excerpt || '', currentDir, sourceToUrl);
  data.more = resolveMdLinks(data.more || '', currentDir, sourceToUrl);

  return data;
});

// Safety net: also handle .md links in rendered HTML
hexo.extend.filter.register('after_post_render', function(data) {
  if (!data.content || !data.source) return data;

  const sourceToUrl = buildSourceToUrl(this);
  if (!sourceToUrl) return data;

  const currentDir = path.dirname(data.source);

  data.content = data.content.replace(
    /<a\b[^>]*?\bhref="([^"]*\.md(?:#[^"]*)?)"/g,
    function(linkMatch, href) {
      const m = href.match(/^([^#]*)(#.*)?$/);
      const linkPath = m[1];
      const fragment = m[2] || '';

      const resolved = path.posix.resolve('/', currentDir, linkPath).substring(1);

      if (sourceToUrl[resolved]) {
        return linkMatch.replace(href, sourceToUrl[resolved] + fragment);
      }

      return linkMatch;
    }
  );

  return data;
});
