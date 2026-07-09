/**
 * Repairs invalid HTML nesting by extracting block-level elements out of <p> tags.
 *
 * CKEditor can produce HTML with block-level elements (figure, table, ul, ol,
 * div, blockquote, etc.) nested inside <p> tags, which is illegal per the HTML
 * spec. Browsers auto-correct this during parsing, but React SSR sends the raw
 * (broken) HTML. When React tries to hydrate, the browser DOM doesn't match
 * React's VDOM → `insertBefore` HierarchyRequestError on hard loads / external links.
 *
 * This function iteratively extracts block-level children out of <p> wrappers,
 * reproducing what the browser would parse — so SSR output matches the live DOM.
 */
function repairHtmlNesting(html: string): string {
  // These block-level tags are forbidden as children of <p> per the HTML spec.
  // When the browser encounters them inside <p>, it closes the <p> first.
  const blockInP =
    "figure|table|ul|ol|blockquote|div|h1|h2|h3|h4|h5|h6|section|article|aside|header|footer|pre|address"

  // Regex: matches a <p ...> tag, then content that contains a block element, up to </p>
  // We do multiple passes because there can be consecutive block elements inside one <p>.
  const re = new RegExp(
    `(<p(?:\\s[^>]*)?>)((?:(?!<p(?:\\s[^>]*)?>).)*?)(<(?:${blockInP})(?:\\s[^>]*)?>[\\s\\S]*?</(?:${blockInP})>)((?:(?!<p(?:\\s[^>]*)?>).)*?)(</p>)`,
    "gi"
  )

  let prev = ""
  let result = html

  // Iterate until no more matches (handles multiple block children per <p>)
  while (result !== prev) {
    prev = result
    result = result.replace(re, (_match, pOpen, before, block, after, pClose) => {
      const beforeTrimmed = before.trimEnd()
      const afterTrimmed = after.trimStart()
      // Rebuild: close the <p> before the block, emit the block, reopen <p> after (if there's content)
      const parts: string[] = []
      if (beforeTrimmed) parts.push(`${pOpen}${beforeTrimmed}${pClose}`)
      parts.push(block)
      if (afterTrimmed) parts.push(`${pOpen}${afterTrimmed}${pClose}`)
      return parts.join("")
    })
  }

  // Second pass: CKEditor sometimes wraps block-level elements inside <a> inside <p>:
  // <p><a href="..."><figure>...</figure></a></p>
  // Browsers auto-close <p> before <figure> even when it's inside <a>, causing
  // React SSR↔DOM mismatch (HierarchyRequestError on insertBefore).
  // Fix: unwrap the <a> when it only wraps a block-level element, hoisting the block out.
  const blockInAInP = new RegExp(
    `(<p(?:\\s[^>]*)?>)([^<]*)<a(\\s[^>]*)?>\\s*(<(?:${blockInP})(?:\\s[^>]*)?>)`,
    "gi"
  )
  result = result.replace(blockInAInP, (_match, pOpen, before, _aAttrs, blockOpen) => {
    const beforeTrimmed = before.trimEnd()
    if (beforeTrimmed) {
      return `${pOpen}${beforeTrimmed}</p>${blockOpen}`
    }
    return `</p>${blockOpen}`
  })

  // Close any dangling </a></p> that were opened by the above unwrap.
  result = result.replace(
    new RegExp(`(<\/(?:${blockInP})>)\\s*<\/a>\\s*(<\/p>)`, "gi"),
    "$1"
  )

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
