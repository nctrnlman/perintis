"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold as BoldIcon, Italic as ItalicIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  boldLabel: string;
  italicLabel: string;
  placeholder?: string;
}

export function RichTextEditor({
  value,
  onChange,
  boldLabel,
  italicLabel,
  placeholder,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        code: false,
        strike: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "min-h-16 px-3.5 py-2.5 text-sm outline-none",
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
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
