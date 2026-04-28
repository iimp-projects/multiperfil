"use client";

import { useState, useEffect } from "react";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Undo, 
  Redo,
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Mount-only: avoids SSR/hydration mismatch for editor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl max-w-full h-auto shadow-lg my-4',
        },
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const addImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          editor?.chain().focus().setImage({ src: data.url }).run();
          toast.success("Imagen subida con éxito");
        } else {
          toast.error(data.message || "Error al subir imagen");
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Error al conectar con el servidor");
      } finally {
        setIsUploading(false);
      }
    };
    input.click();
  };

  if (!mounted || !editor) return null;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg transition-colors ${editor.isActive("bold") ? "bg-primary text-white" : "hover:bg-slate-200 text-slate-600"}`}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg transition-colors ${editor.isActive("italic") ? "bg-primary text-white" : "hover:bg-slate-200 text-slate-600"}`}
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded-lg transition-colors ${editor.isActive("underline") ? "bg-primary text-white" : "hover:bg-slate-200 text-slate-600"}`}
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-slate-200 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-lg transition-colors ${editor.isActive("bulletList") ? "bg-primary text-white" : "hover:bg-slate-200 text-slate-600"}`}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded-lg transition-colors ${editor.isActive("orderedList") ? "bg-primary text-white" : "hover:bg-slate-200 text-slate-600"}`}
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`p-2 rounded-lg transition-colors ${editor.isActive({ textAlign: "left" }) ? "bg-primary text-white" : "hover:bg-slate-200 text-slate-600"}`}
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`p-2 rounded-lg transition-colors ${editor.isActive({ textAlign: "center" }) ? "bg-primary text-white" : "hover:bg-slate-200 text-slate-600"}`}
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`p-2 rounded-lg transition-colors ${editor.isActive({ textAlign: "right" }) ? "bg-primary text-white" : "hover:bg-slate-200 text-slate-600"}`}
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <button
          type="button"
          onClick={addImage}
          disabled={isUploading}
          className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-50"
          title="Insertar imagen"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
        </button>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 disabled:opacity-30"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 disabled:opacity-30"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      <EditorContent 
        editor={editor} 
        className="p-4 min-h-[250px] max-h-[500px] overflow-y-auto prose prose-sm max-w-none focus:outline-none" 
      />
    </div>
  );
}
