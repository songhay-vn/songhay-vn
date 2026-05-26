"use client"

import { useMemo, useRef } from "react"
import { CKEditor } from "@ckeditor/ckeditor5-react"
import {
  Alignment,
  AutoLink,
  BlockQuote,
  Bold,
  ClassicEditor,
  Code,
  CodeBlock,
  Essentials,
  FindAndReplace,
  FontBackgroundColor,
  FontColor,
  FontFamily,
  FontSize,
  GeneralHtmlSupport,
  Heading,
  HeadingButtonsUI,
  Highlight,
  HorizontalLine,
  HtmlEmbed,
  Image,
  ImageCaption,
  ImageInsertViaUrl,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  Indent,
  IndentBlock,
  Italic,
  Link,
  ListProperties,
  MediaEmbed,
  Mention,
  List,
  Paragraph,
  ParagraphButtonUI,
  PasteFromOffice,
  RemoveFormat,
  ShowBlocks,
  SpecialCharacters,
  SpecialCharactersArrows,
  SpecialCharactersCurrency,
  SpecialCharactersEssentials,
  SpecialCharactersLatin,
  SpecialCharactersMathematical,
  SpecialCharactersText,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
  TextPartLanguage,
  TodoList,
  Underline,
  WordCount,
  Plugin,
  ButtonView,
  type EditorConfig,
} from "ckeditor5"
import "ckeditor5/ckeditor5-editor.css"

const cleanHtmlContent = (htmlData: string) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlData, "text/html")

  const allowedAttributes = ["src", "alt", "title", "colspan", "rowspan", "target", "href", "style", "class"]
  const elements = Array.from(doc.body.querySelectorAll("*"))

  elements.forEach(el => {
    // Remove unwanted/garbage tags entirely
    if (["META", "LINK", "SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "BUTTON", "INPUT", "FORM", "SELECT", "TEXTAREA", "NAV", "HEADER", "FOOTER", "ASIDE"].includes(el.tagName)) {
      el.remove()
      return
    }

    // Remove all attributes except allowed ones
    const attrs = Array.from(el.attributes)
    attrs.forEach(attr => {
      if (!allowedAttributes.includes(attr.name.toLowerCase())) {
        el.removeAttribute(attr.name)
      }
    })
  })

  return doc.body.innerHTML
}

class PastePlainTextPlugin extends Plugin {
  init() {
    const editor = this.editor

    // 1. Intercept standard Ctrl+V (Paste) and clean it automatically
    editor.editing.view.document.on('clipboardInput', (_evt, data) => {
      const htmlData = data.dataTransfer?.getData('text/html')
      if (htmlData) {
        const cleanHtml = cleanHtmlContent(htmlData)
        // Set the cleaned html directly, which bypasses CKEditor's raw HTML conversion
        data.content = editor.data.processor.toView(cleanHtml)
      }
    }, { priority: 'high' })

    // 2. Toolbar Button manual clean paste
    editor.ui.componentFactory.add("pastePlainText", (locale) => {
      const view = new ButtonView(locale)
      view.set({
        label: "Dán làm sạch",
        tooltip: "Dán lược bỏ định dạng rác (giữ lại bôi đậm, đoạn văn...)",
        withText: true,
      })

      view.on("execute", async () => {
        try {
          let htmlData = ""
          let textData = ""

          try {
            const clipboardItems = await navigator.clipboard.read()
            for (const item of clipboardItems) {
              if (item.types.includes("text/html")) {
                const blob = await item.getType("text/html")
                htmlData = await blob.text()
              }
              if (item.types.includes("text/plain")) {
                const blob = await item.getType("text/plain")
                textData = await blob.text()
              }
            }
          } catch (e) {
            console.warn("Could not read clipboard items, looking for fallback", e)
          }

          if (htmlData) {
            const cleanHtml = cleanHtmlContent(htmlData)
            const viewFragment = editor.data.processor.toView(cleanHtml)
            const modelFragment = editor.data.toModel(viewFragment)

            editor.model.change((writer) => {
              editor.model.insertContent(modelFragment)
            })
            return
          }

          const text = textData || await navigator.clipboard.readText()
          if (text) {
            const escapeHtml = (unsafe: string) => {
              return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
            }

            const paragraphsHTML = text
              .split('\n')
              .map(line => line.trim())
              .filter(line => line.length > 0)
              .map(line => `<p>${escapeHtml(line)}</p>`)
              .join('')

            const viewFragment = editor.data.processor.toView(paragraphsHTML || escapeHtml(text))
            const modelFragment = editor.data.toModel(viewFragment)
            editor.model.change((writer) => {
              editor.model.insertContent(modelFragment)
            })
          }
        } catch (err) {
          console.error(err)
          alert("Trình duyệt chặn quyền truy cập Clipboard. Vui lòng cấp quyền hoặc sử dụng Ctrl+V như bình thường.")
        }
      })

      return view
    })
  }
}

type CKEditorWrapperProps = {
  data: string
  onChange: (data: string) => void
  placeholder?: string
  onReady?: (editor: any) => void
}

export function CKEditorWrapper({ data, onChange, placeholder, onReady }: CKEditorWrapperProps) {
  const wordCountRef = useRef<HTMLDivElement>(null)

  const config = useMemo(() => ({
    licenseKey: "GPL",
    plugins: [
      Essentials, Paragraph, Heading, HeadingButtonsUI, ParagraphButtonUI, Alignment, Bold, Italic, Underline,
      Strikethrough, Subscript, Superscript, Code, CodeBlock, RemoveFormat,
      FontFamily, FontSize, FontColor, FontBackgroundColor, Highlight,
      Link, AutoLink, List, ListProperties, TodoList, Indent, IndentBlock,
      BlockQuote, HorizontalLine, ShowBlocks, FindAndReplace, PasteFromOffice,
      SpecialCharacters, SpecialCharactersEssentials, SpecialCharactersArrows,
      SpecialCharactersCurrency, SpecialCharactersLatin, SpecialCharactersMathematical,
      SpecialCharactersText, TextPartLanguage, Table, TableToolbar, TableCaption,
      TableCellProperties, TableColumnResize, TableProperties, Image, ImageCaption,
      ImageResize, ImageStyle, ImageToolbar, ImageInsertViaUrl, MediaEmbed,
      HtmlEmbed, GeneralHtmlSupport, Mention, PastePlainTextPlugin, WordCount,
    ],
    toolbar: {
      items: [
        "undo", "redo", "pastePlainText", "|", "paragraph", "heading1", "heading2", "heading3", "|",
        "fontFamily", "fontSize", "fontColor", "fontBackgroundColor", "highlight", "|",
        "bold", "italic", "underline", "strikethrough", "subscript", "superscript",
        "code", "removeFormat", "|", "link", "insertImageViaUrl", "mediaEmbed",
        "insertTable", "blockQuote", "codeBlock", "htmlEmbed", "specialCharacters",
        "horizontalLine", "|", "alignment", "bulletedList", "numberedList", "todoList",
        "outdent", "indent", "|", "showBlocks", "findAndReplace",
      ],
      shouldNotGroupWhenFull: true,
    },
    heading: {
      options: [
        { model: "paragraph", title: "Đoạn văn", class: "ck-heading_paragraph" },
        { model: "heading1", view: "h1", title: "Heading 1", class: "ck-heading_heading1" },
        { model: "heading2", view: "h2", title: "Heading 2", class: "ck-heading_heading2" },
        { model: "heading3", view: "h3", title: "Heading 3", class: "ck-heading_heading3" },
      ],
    },
    link: { addTargetToExternalLinks: true },
    image: {
      toolbar: [
        "toggleImageCaption", "imageTextAlternative", "|",
        "imageStyle:inline", "imageStyle:block", "imageStyle:side", "|", "resizeImage",
      ],
    },
    mediaEmbed: { previewsInData: true },
    htmlSupport: {
      allow: [{ name: /.*/, attributes: true, classes: true, styles: true }],
    },
    mention: {
      feeds: [{ marker: "@", feed: ["admin", "editor", "reviewer", "seo"], minimumCharacters: 1 }],
    },
    table: {
      contentToolbar: ["tableColumn", "tableRow", "mergeTableCells", "tableProperties", "tableCellProperties"],
    },
    placeholder,
  }) satisfies EditorConfig, [placeholder])

  return (
    <div className="ck-full-editor overflow-hidden rounded-md border border-zinc-300 bg-white flex flex-col">
      <div className="flex-1 overflow-hidden">
        <CKEditor
          editor={ClassicEditor}
          data={data}
          config={config}
          onChange={(_event, editor) => onChange(editor.getData())}
          onReady={(editor) => {
            if (onReady) onReady(editor)
            const wordCountPlugin = editor.plugins.get("WordCount")
            if (wordCountRef.current && wordCountPlugin) {
              wordCountRef.current.innerHTML = ""
              wordCountRef.current.appendChild(wordCountPlugin.wordCountContainer)
            }
          }}
        />
      </div>
      <div ref={wordCountRef} className="px-3 md:px-4 py-1.5 bg-zinc-50 border-t border-zinc-200 text-[11px] text-zinc-500 font-medium flex justify-end items-center empty:hidden"></div>
    </div>
  )
}
