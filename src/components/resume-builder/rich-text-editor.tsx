"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold as BoldIcon,
  Code as CodeIcon,
  Italic as ItalicIcon,
  List as ListIcon,
  ListOrdered as ListOrderedIcon,
  Minus as MinusIcon,
  Strikethrough as StrikethroughIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  boldLabel: string;
  italicLabel: string;
  bulletListLabel?: string;
  orderedListLabel?: string;
  strikeLabel?: string;
  codeLabel?: string;
  horizontalRuleLabel?: string;
  allowExtendedFormatting?: boolean;
  placeholder?: string;
}

export function RichTextEditor({
  value,
  onChange,
  boldLabel,
  italicLabel,
  bulletListLabel,
  orderedListLabel,
  strikeLabel,
  codeLabel,
  horizontalRuleLabel,
  allowExtendedFormatting = false,
  placeholder,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: allowExtendedFormatting ? undefined : false,
        orderedList: allowExtendedFormatting ? undefined : false,
        listItem: allowExtendedFormatting ? undefined : false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: allowExtendedFormatting ? undefined : false,
        code: allowExtendedFormatting ? undefined : false,
        strike: allowExtendedFormatting ? undefined : false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: cn(
          "min-h-16 px-3.5 py-2.5 text-sm outline-none",
          "[&_p]:mb-3 [&_p:last-child]:mb-0",
          "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:list-outside [&_ul]:space-y-0.5 [&_ul]:pl-5",
          "[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:list-outside [&_ol]:space-y-0.5 [&_ol]:pl-5",
          "[&_li]:pl-0.5 [&_li_p]:m-0 [&_li_p]:inline",
          "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs",
          "[&_hr]:my-2 [&_hr]:border-border"
        ),
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  const toolbarButtonClass = (active: boolean) =>
    cn(
      "flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground",
      active && "bg-muted text-foreground"
    );

  return (
    <div className="overflow-hidden rounded-xl border border-input transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
      <div className="flex items-center gap-1 border-b border-border bg-muted/30 p-1.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label={boldLabel}
          className={toolbarButtonClass(editor.isActive("bold"))}
        >
          <BoldIcon className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label={italicLabel}
          className={toolbarButtonClass(editor.isActive("italic"))}
        >
          <ItalicIcon className="size-3.5" />
        </button>

        {allowExtendedFormatting && (
          <>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              aria-label={strikeLabel}
              className={toolbarButtonClass(editor.isActive("strike"))}
            >
              <StrikethroughIcon className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCode().run()}
              aria-label={codeLabel}
              className={toolbarButtonClass(editor.isActive("code"))}
            >
              <CodeIcon className="size-3.5" />
            </button>

            <div className="mx-0.5 h-4 w-px bg-border" />

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              aria-label={bulletListLabel}
              className={toolbarButtonClass(editor.isActive("bulletList"))}
            >
              <ListIcon className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              aria-label={orderedListLabel}
              className={toolbarButtonClass(editor.isActive("orderedList"))}
            >
              <ListOrderedIcon className="size-3.5" />
            </button>

            <div className="mx-0.5 h-4 w-px bg-border" />

            <button
              type="button"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              aria-label={horizontalRuleLabel}
              className={toolbarButtonClass(false)}
            >
              <MinusIcon className="size-3.5" />
            </button>
          </>
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
