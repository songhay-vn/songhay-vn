import { parse, HTMLElement as NHTMLElement } from "node-html-parser"

/**
 * Repairs invalid HTML nesting so React SSR output matches the browser DOM.
 *
 * WHY THIS EXISTS
 * ───────────────
 * CKEditor (with GeneralHtmlSupport, HtmlEmbed, MediaEmbed, PasteFromOffice,
 * Link-wrapping-images, etc.) can produce HTML that is illegal per the HTML5
 * spec — e.g. block-level elements (figure, table, ul, div, …) nested inside
 * <p> tags, directly or buried inside inline ancestors like <a> or <span>.
 *
 * Browsers auto-correct this during parsing: they close the <p> *before*
 * emitting any block-level descendant. React SSR sends the raw (broken) HTML
 * while the browser builds a corrected DOM — mismatch → insertBefore
 * HierarchyRequestError on hydration.
 *
 * WHY REGEX FAILED
 * ────────────────
 * Regex cannot reliably parse HTML. Every new CKEditor plugin or paste source
 * can produce a new structural pattern that the regex misses, causing the bug
 * to reappear days later when a new article with that pattern is published.
 *
 * THE FIX
 * ───────
 * Use node-html-parser — an HTML5-spec-compliant parser — to parse the raw
 * HTML into a real DOM tree, then walk that tree and flatten any block-level
 * element found inside a <p> out to the top level. The serialised output
 * matches what the browser builds, so React hydration always succeeds.
 */

// Per the HTML5 spec, these elements are NOT allowed as descendants of <p>.
// When a browser encounters one inside <p> (at any depth through inline
// ancestors), it first implicitly closes the <p>.
// NOTE: "p" is intentionally excluded — containsBlock is used to check
// whether a <p>'s *children* contain block elements. If we included "p"
// itself, every <p> would wrongly return true from containsBlock.
const BLOCK_ELEMENTS = new Set([
  "address", "article", "aside", "blockquote", "canvas", "dd", "details",
  "dialog", "div", "dl", "dt", "fieldset", "figcaption", "figure", "footer",
  "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hgroup", "hr",
  "li", "main", "nav", "noscript", "ol", "pre", "section", "summary",
  "table", "template", "ul",
])

/**
 * Returns true if the node or any of its descendants is a block-level element.
 */
function containsBlock(node: NHTMLElement): boolean {
  if (BLOCK_ELEMENTS.has(node.tagName?.toLowerCase() ?? "")) return true
  for (const child of node.childNodes) {
    if (child instanceof NHTMLElement && containsBlock(child)) return true
  }
  return false
}

/**
 * Serialise a node back to its HTML string, preserving all attributes.
 */
function outerHtml(node: NHTMLElement): string {
  return node.outerHTML
}

/**
 * Given a <p> element that contains block-level descendants, flatten it into
 * a sequence of sibling nodes:
 *   <p>text<figure>…</figure>more text</p>
 *   → <p>text</p><figure>…</figure><p>more text</p>
 *
 * Works recursively so that deeply nested blocks (inside <a>, <span>, …) are
 * also correctly extracted.
 */
function flattenP(p: NHTMLElement): string {
  const pOpen = `<p${p.rawAttrs ? " " + p.rawAttrs : ""}>`
  const pClose = "</p>"

  // Collect top-level children and split on the first block element found.
  // We work on the *serialised* children to avoid mutating the live tree.
  const parts: string[] = []
  let inlineBuf = ""

  for (const child of p.childNodes) {
    const isElement = child instanceof NHTMLElement
    if (!isElement) {
      // Text node
      inlineBuf += child.toString()
      continue
    }

    const el = child as NHTMLElement
    const tag = el.tagName?.toLowerCase() ?? ""

    if (BLOCK_ELEMENTS.has(tag)) {
      // Flush inline content before the block
      if (inlineBuf.trim()) parts.push(`${pOpen}${inlineBuf}${pClose}`)
      inlineBuf = ""
      // Recursively fix the block itself (it might have its own bad nesting)
      parts.push(repairNode(el))
    } else if (containsBlock(el)) {
      // Inline element (e.g. <a>, <span>) that *contains* a block — split it.
      // We serialize its children and re-run the whole algorithm on a synthetic
      // <p> wrapping each portion.
      const innerHtml = el.innerHTML
      // Re-parse the inner HTML as if it were directly inside a <p>
      const syntheticP = parse(`${pOpen}${innerHtml}${pClose}`).querySelector("p")
      if (syntheticP) {
        const flattened = flattenP(syntheticP)
        if (inlineBuf.trim()) parts.push(`${pOpen}${inlineBuf}${pClose}`)
        inlineBuf = ""
        parts.push(flattened)
      } else {
        inlineBuf += outerHtml(el)
      }
    } else {
      // Safe inline element
      inlineBuf += outerHtml(el)
    }
  }

  // Flush remaining inline content
  if (inlineBuf.trim()) parts.push(`${pOpen}${inlineBuf}${pClose}`)

  return parts.join("")
}

/**
 * Recursively repair a single DOM node and return its corrected HTML string.
 */
function repairNode(node: NHTMLElement): string {
  const tag = node.tagName?.toLowerCase() ?? ""

  if (tag === "p") {
    if (containsBlock(node)) {
      return flattenP(node)
    }
    // <p> with only safe inline content — leave as-is
    return outerHtml(node)
  }

  // For all other elements: recursively repair their children
  if (!node.childNodes.length) return outerHtml(node)

  let innerHtml = ""
  for (const child of node.childNodes) {
    if (child instanceof NHTMLElement) {
      innerHtml += repairNode(child)
    } else {
      innerHtml += child.toString()
    }
  }

  const rawAttrs = node.rawAttrs ? " " + node.rawAttrs : ""
  // Self-closing / void elements
  const VOID_ELEMENTS = new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"])
  if (VOID_ELEMENTS.has(tag)) return `<${tag}${rawAttrs}>`
  return `<${tag}${rawAttrs}>${innerHtml}</${tag}>`
}

function repairHtmlNesting(html: string): string {
  if (!html?.trim()) return html

  const root = parse(html, {
    lowerCaseTagName: true,
    comment: true,
    fixNestedATags: true,
    parseNoneClosedTags: false,
    voidTag: {
      tags: ["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"],
      // Keep self-closing slash (e.g. <img />) so output matches the input
      // and doesn't break existing tests or content that relies on XHTML syntax.
      closingSlash: true,
    },
  })

  let result = ""
  for (const child of root.childNodes) {
    if (child instanceof NHTMLElement) {
      result += repairNode(child)
    } else {
      result += child.toString()
    }
  }

  return result
}


export function normalizeArticleHtml(rawHtml: string) {
  const blockTags = "p|h1|h2|h3|h4|h5|h6|li|blockquote|div|figure|figcaption|ul|ol|table|thead|tbody|tr|td|th|section|article|aside|header|footer"

  return repairHtmlNesting(rawHtml)
    .replace(/\r?\n|\r/g, " ")
    .replace(/\s+/g, " ")
    // We only remove spacing between a block tag and another tag to avoid breaking inline formatting (like links next to strong text).
    .replace(new RegExp(`(</?(?:${blockTags})\\b[^>]*>)\\s+(?=<)`, "gi"), "$1")
    .replace(new RegExp(`>\\s+(</?(?:${blockTags})\\b[^>]*>)`, "gi"), ">$1")
    .replace(/<p[^>]*>(?:\s|&nbsp;|\u00A0|<br\s*\/?>)*<\/p>/gi, '<p class="empty-line"></p>') // Convert CKEditor's empty paragraphs to explicitly classed empty paragraphs
    .replace(/<span([^>]*)style="([^"]*)"([^>]*)>([\s\S]*?)<\/span>/gi, (match, before, styleValue, after, content) => {
      const hasUnderline = /text-decoration\s*:\s*underline/i.test(styleValue)
      const hasStrikethrough = /text-decoration\s*:\s*line-through/i.test(styleValue)
      const hasOtherStyles = styleValue.split(";").map((s: string) => s.trim()).filter((s: string) => s && !s.toLowerCase().startsWith("text-decoration")).length > 0

      if (hasOtherStyles) {
        let inner = String(content)
        if (hasUnderline) inner = `<u>${inner}</u>`
        if (hasStrikethrough) inner = `<s>${inner}</s>`
        return `<span${before}style="${styleValue}"${after}>${inner}</span>`
      }

      let result = String(content)
      if (hasUnderline) result = `<u>${result}</u>`
      if (hasStrikethrough) result = `<s>${result}</s>`
      return result
    })
    .replace(/\sstyle="([^"]*)"/gi, (_match, styleValue) => {
      const rules = String(styleValue)
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean)

      const keptRules: string[] = []

      for (const rule of rules) {
        const [rawProperty, rawValue] = rule.split(":")
        const property = rawProperty?.trim().toLowerCase()
        const value = rawValue?.trim().toLowerCase()

        if (!property || !value) {
          continue
        }

        if (property === "text-align" && ["left", "right", "center", "justify"].includes(value)) {
          keptRules.push(`text-align:${value}`)
        }

        if (property === "float" && ["left", "right", "none"].includes(value)) {
          keptRules.push(`float:${value}`)
        }

        if (property === "text-decoration" && /^(underline|line-through|none)$/i.test(value)) {
          keptRules.push(`text-decoration:${value}`)
        }

        if (
          ["width", "max-width", "height"].includes(property) &&
          /^(auto|\d+(\.\d+)?(px|%))$/i.test(value)
        ) {
          keptRules.push(`${property}:${value}`)
        }
      }

      return keptRules.length ? ` style="${keptRules.join(";")}"` : ""
    })
    .trim()
}
