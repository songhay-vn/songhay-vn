export function normalizeArticleHtml(rawHtml: string) {
  const blockTags = "p|h1|h2|h3|h4|h5|h6|li|blockquote|div|figure|figcaption|ul|ol|table|thead|tbody|tr|td|th|section|article|aside|header|footer"

  return rawHtml
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

const ADSENSE_CLIENT = "ca-pub-1176898129958487"

export function injectInlineAdAfterSecondParagraph(html: string) {
  const createInlineAdSlot = (label: string) => `<div class="ad-slot-wrapper"><ins class="adsbygoogle block w-full" style="display:block" data-ad-client="${ADSENSE_CLIENT}" data-ad-format="auto" data-full-width-responsive="true" aria-label="${label}"></ins></div>`

  const secondParagraphAd = createInlineAdSlot("Giữa bài viết đoạn 1 (Google AdSense)")
  const sixthParagraphAd = createInlineAdSlot("Giữa bài viết đoạn 2 (Google AdSense)")

  let paragraphCount = 0
  let insertedFirst = false
  let insertedSecond = false
  const withInlineAd = html.replace(/<\/p>/gi, (match) => {
    paragraphCount += 1

    if (!insertedFirst && paragraphCount === 2) {
      insertedFirst = true
      return `${match}${secondParagraphAd}`
    }

    if (!insertedSecond && paragraphCount === 6) {
      insertedSecond = true
      return `${match}${sixthParagraphAd}`
    }

    return match
  })

  if (!insertedFirst && !insertedSecond) {
    return `${withInlineAd}${secondParagraphAd}`
  }

  if (insertedFirst && !insertedSecond) {
    return `${withInlineAd}${sixthParagraphAd}`
  }

  return withInlineAd
}
