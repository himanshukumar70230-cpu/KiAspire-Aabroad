const { marked } = require("marked");
const sanitizeHtml = require("sanitize-html");

// Admin-authored country write-ups are stored as Markdown and rendered here
// at request time, not stored as raw HTML — see ARCHITECTURE.md section 4a
// for why (stored-XSS surface if a raw-HTML admin field were ever rendered
// unsanitized).
function renderMarkdown(markdownSource) {
  const html = marked.parse(markdownSource || "", { async: false });

  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title"],
      a: ["href", "name", "target", "rel"],
    },
  });
}

module.exports = { renderMarkdown };
