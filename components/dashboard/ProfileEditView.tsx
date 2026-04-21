"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Save,
  User,
  Mail,
  Phone,
  BadgeCheck,
  Camera,
  Info,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  Minus,
  Undo2,
  Redo2,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Palette,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { getBucketName, getFullImageUrl } from "@/lib/s3-utils";
import { userService } from "@/services/user.service";
import { SaveDataRequest } from "@/types/auth";
import { i18nToast } from "@/lib/translate";
import {
  Button,
  Input,
  useVertical,
  Field,
  FieldLabel,
  Card,
} from "@nrivera-iimp/ui-kit-iimp";
import { getDynamicEventCode } from "@/lib/utils/event";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";

const SectionHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <div className="mb-8">
    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
      {title}
    </h2>
    <p className="text-slate-500 mt-1">{subtitle}</p>
  </div>
);

// --- Tiptap Toolbar Button Component ---
const ButtonAction = ({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) => (
  <Button
    variant={isActive ? "default" : "ghost"}
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    disabled={disabled}
    className={`p-2 hover:bg-slate-100 rounded-lg transition-all flex items-center justify-center h-auto ${
      isActive ? "text-primary bg-primary/10 shadow-sm" : "text-slate-500"
    } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
    title={title}
  >
    {children}
  </Button>
);

// --- Tiptap Toolbar Component ---
const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 p-3 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10 overflow-x-auto no-scrollbar scroll-smooth overscroll-contain scroll-touch whitespace-nowrap">
      {/* History */}
      <div className="flex items-center gap-1 mr-2 px-1 border-r border-slate-100 shrink-0">
        <ButtonAction
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          title="Deshacer"
        >
          <Undo2 size={16} />
        </ButtonAction>
        <ButtonAction
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          title="Rehacer"
        >
          <Redo2 size={16} />
        </ButtonAction>
      </div>

      {/* Basic Formatting */}
      <div className="flex items-center gap-1 mr-2 px-1 border-r border-slate-100 shrink-0">
        <ButtonAction
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Negrita"
        >
          <span className="font-serif font-black underline-none text-sm">
            B
          </span>
        </ButtonAction>
        <ButtonAction
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Itálica"
        >
          <span className="font-serif font-black italic text-sm">I</span>
        </ButtonAction>
        <ButtonAction
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          title="Subrayado"
        >
          <span className="font-serif font-black underline text-sm">U</span>
        </ButtonAction>
        <ButtonAction
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title="Tachado"
        >
          <Strikethrough size={16} />
        </ButtonAction>
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-1 mr-2 px-1 border-r border-slate-100 shrink-0">
        <ButtonAction
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          title="Alinear a la izquierda"
        >
          <AlignLeft size={16} />
        </ButtonAction>
        <ButtonAction
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          title="Centrar"
        >
          <AlignCenter size={16} />
        </ButtonAction>
        <ButtonAction
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          title="Alinear a la derecha"
        >
          <AlignRight size={16} />
        </ButtonAction>
        <ButtonAction
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          isActive={editor.isActive({ textAlign: "justify" })}
          title="Justificar"
        >
          <AlignJustify size={16} />
        </ButtonAction>
      </div>

      {/* Headings & Blocks */}
      <div className="flex items-center gap-1 mr-2 px-1 border-r border-slate-100 shrink-0">
        <ButtonAction
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor.isActive("heading", { level: 1 })}
          title="Título 1"
        >
          <Heading1 size={16} />
        </ButtonAction>
        <ButtonAction
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive("heading", { level: 2 })}
          title="Título 2"
        >
          <Heading2 size={16} />
        </ButtonAction>
        <ButtonAction
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive("heading", { level: 3 })}
          title="Título 3"
        >
          <Heading3 size={16} />
        </ButtonAction>
        <ButtonAction
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Cita"
        >
          <Quote size={16} />
        </ButtonAction>
      </div>

      {/* Lists & Extras */}
      <div className="flex items-center gap-1 mr-2 px-1 border-r border-slate-100 shrink-0">
        <ButtonAction
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Lista de viñetas"
        >
          <div className="flex flex-col gap-0.5">
            <div className="w-3 h-0.5 bg-current rounded-full" />
            <div className="w-2 h-0.5 bg-current rounded-full" />
            <div className="w-3 h-0.5 bg-current rounded-full" />
          </div>
        </ButtonAction>
        <ButtonAction
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Lista numerada"
        >
          <span className="text-[10px] font-black">1.2.</span>
        </ButtonAction>
        <ButtonAction
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Línea divisoria"
        >
          <Minus size={16} />
        </ButtonAction>
      </div>

      {/* Color Picker */}
      <div className="flex items-center gap-2 ml-auto px-1">
        <label className="relative cursor-pointer p-2 hover:bg-slate-100 rounded-lg transition-all flex items-center justify-center text-slate-500 group">
          <Palette
            size={18}
            style={{
              color: editor.getAttributes("textStyle").color || "currentColor",
            }}
            className="transition-colors"
          />
          <input
            type="color"
            onInput={(e) => {
              const color = (e.target as HTMLInputElement).value;
              editor.chain().focus().setColor(color).run();
            }}
            value={editor.getAttributes("textStyle").color || "#000000"}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            title="Elegir color de texto"
          />
          <span
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-current rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: editor.getAttributes("textStyle").color }}
          />
        </label>
      </div>
    </div>
  );
};

export default function ProfileEditView() {
  const { user, updateUser } = useAuthStore();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(
    getFullImageUrl(user?.picture) || null,
  );
  const [s3Key, setS3Key] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: user?.bio || "",
    editable: true,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none focus:outline-none p-4 min-h-[150px] text-slate-900 break-words",
      },
    },
  });

  const [formData, setFormData] = React.useState({
    nombreCompleto: "",
    numeroTelefono: "",
    cargoProfesional: "",
    empresa: "",
    ubicacionOficina: "",
    correoElectronico: "",
  });

  const [errors, setErrors] = React.useState({
    nombreCompleto: "",
    numeroTelefono: "",
    cargoProfesional: "",
    correoElectronico: "",
  });

  const { vertical } = useVertical();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setFormData({
        nombreCompleto: [
          user.nombres,
          user.apellidoPaterno,
          user.apellidoMaterno,
        ]
          .filter(Boolean)
          .join(" "),
        numeroTelefono: user.telefono || user.celular || "",
        cargoProfesional: user.cargo || "",
        empresa: user.empresa || "",
        ubicacionOficina: user.ubicacionOficina || "",
        correoElectronico: user.email || "",
      });
      if (editor && user.bio) {
        editor.commands.setContent(user.bio);
      }
    }
  }, [user, editor]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Real-time validation
    let error = "";
    if (name === "nombreCompleto") {
      if (value && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
        error = "Sólo se permiten letras y espacios";
      }
    } else if (name === "numeroTelefono") {
      if (value && !/^\+?[0-9\s]*$/.test(value)) {
        error = "Sólo se permiten números y el símbolo '+'";
      }
    } else if (name === "cargoProfesional") {
      if (value && !/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]*$/.test(value)) {
        error = "Sólo se permiten letras, números y espacios";
      }
    } else if (name === "correoElectronico") {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = "Formato de correo electrónico inválido";
      }
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };
  const handleSubmit = async (newPictureKey?: string) => {
    // Reset identifier logic: use user.siecode strictly if available from session
    const userIdentifier = user?.siecode || user?.nu_documento;

    if (!userIdentifier) {
      i18nToast.error(
        "No se pudo identificar al participante para guardar los cambios",
        "Could not identify the participant to save changes"
      );
      setIsSubmitting(false);
      return;
    }

    const hasErrors = Object.values(errors).some((error) => error !== "");
    if (hasErrors) {
      i18nToast.error(
        "Por favor corrija los errores en el formulario antes de guardar",
        "Please correct the errors in the form before saving"
      );
      return;
    }

    setIsSubmitting(true);
    const loadingToast = i18nToast.loading(
      "Guardando cambios...",
      "Saving changes..."
    );
    try {
      const dynamicEvent = getDynamicEventCode(vertical);

      // 1. Sanitize the picture key to avoid circular structures (e.g. if an event is passed)
      let finalPicture = user?.picture || "";
      if (typeof newPictureKey === "string" && newPictureKey.trim() !== "") {
        finalPicture = newPictureKey;
      } else if (s3Key) {
        finalPicture = s3Key;
      }

      const payload: SaveDataRequest = {
        event: dynamicEvent,
        siecode: userIdentifier,
        nombreCompleto: formData.nombreCompleto,
        numeroTelefono: formData.numeroTelefono,
        cargoProfesional: formData.cargoProfesional,
        empresa: formData.empresa,
        ubicacionOficina: formData.ubicacionOficina,
        correoElectronico: formData.correoElectronico,
        bioProfesional: editor?.getHTML() || "",
        curriculumVitae: "",
        picture: finalPicture,
        visPerfil: user?.visPerfil ? 1 : 0,
        visWhatsapp: user?.visWhatsapp ? 1 : 0,
        notificacion01: user?.notificacion01 ? 1 : 0,
        notificacion02: user?.notificacion02 ? 1 : 0,
      };

      const response = await userService.saveData(payload);

      if (response.success) {
        // Sync data with the Global Store (useAuthStore) to update the header and other components in real-time
        updateUser({
          nombres: formData.nombreCompleto.split(" ")[0],
          apellidoPaterno: formData.nombreCompleto
            .split(" ")
            .slice(1)
            .join(" "),
          telefono: formData.numeroTelefono,
          cargo: formData.cargoProfesional,
          empresa: formData.empresa,
          ubicacionOficina: formData.ubicacionOficina,
          email: formData.correoElectronico,
          bio: payload.bioProfesional,
          picture: payload.picture,
        });
        
        // Update local state if it was a photo upload
        if (typeof newPictureKey === "string") {
          setProfilePhoto(getFullImageUrl(newPictureKey));
        }

        i18nToast.success(
          "Perfil actualizado correctamente",
          "Profile updated successfully",
          { id: loadingToast }
        );
      } else {
        i18nToast.error(
          response.message || "Error al actualizar el perfil",
          "Error updating profile",
          { id: loadingToast }
        );
      }
    } catch {
      i18nToast.error(
        "Error de conexión con el servidor",
        "Server connection error",
        { id: loadingToast }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    const uploadToast = i18nToast.loading(
      "Subiendo foto...",
      "Uploading photo..."
    );

    try {
      const bucketName = getBucketName();

      // 1. Get Pre-signed URL
      const presignedRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          fileType: file.type,
          bucketName: bucketName,
        }),
      });

      const { uploadUrl, publicUrl, key, success, message } =
        await presignedRes.json();

      if (!success) {
        throw new Error(message || "Error al obtener URL de subida");
      }

      // 2. Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Error al subir archivo a S3");
      }

      setProfilePhoto(publicUrl);
      setS3Key(key);
      i18nToast.success(
        "Foto subida correctamente",
        "Photo uploaded successfully",
        { id: uploadToast }
      );

      // Automatically save to backend
      await handleSubmit(key);
    } catch (error: unknown) {
      console.error("Upload Error:", error);
      const message =
        error instanceof Error ? error.message : "Error al subir la foto";
      i18nToast.error(message, message, { id: uploadToast });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <div className="w-full mx-auto font-primary">
      <div className=" mx-auto">
        <SectionHeader
          title="Detalles de la Cuenta"
          subtitle="Actualice su información profesional"
        />

        <Card className="bg-white !border !border-slate-100 p-6 md:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 ">
            {/* Left: Photos & Files */}
            <div className="lg:col-span-4 space-y-8">
              {/* Profile Photo */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full border-8 border-slate-50 shadow-2xl overflow-hidden bg-slate-100 relative ring-4 ring-primary/5 mx-auto transition-all flex items-center justify-center">
                    <Image
                      src={
                        getFullImageUrl(profilePhoto) ||
                        `https://ui-avatars.com/api/?name=${user?.nombres || ""}+${user?.apellidoPaterno || ""}&background=random&size=200`
                      }
                      alt="Profile Photo"
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      unoptimized
                    />
                    <div
                      onClick={() =>
                        !isUploadingPhoto && photoInputRef.current?.click()
                      }
                      className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px] ${
                        isUploadingPhoto ? "opacity-100" : ""
                      }`}
                    >
                      {isUploadingPhoto ? (
                        <Loader2
                          className="animate-spin text-white"
                          size={24}
                        />
                      ) : (
                        <div className="text-center flex flex-col items-center">
                          <Camera className="text-white mb-1.5" size={28} />
                          <span className="text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest leading-none">
                            Cambiar Foto
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={photoInputRef}
                    onChange={handlePhotoChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <div className="mt-4 text-center">
                  <h4 className="text-lg font-bold text-slate-800">
                    {[
                      user?.nombres,
                      user?.apellidoPaterno,
                      user?.apellidoMaterno,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </h4>
                  <p className="text-sm font-medium text-primary uppercase tracking-wider">
                    {user?.cargo || "Ing. Geólogo Senior"}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Form Details */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                <Field>
                  <FieldLabel className="text-[10px] uppercase tracking-[0.15em] font-black text-slate-400 mb-2 block ml-1 break-words">
                    Nombre Completo
                  </FieldLabel>
                  <div className="relative pointer-events-none">
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                      size={18}
                    />
                    <Input
                      name="nombreCompleto"
                      value={formData.nombreCompleto}
                      onChange={handleInputChange}
                      readOnly
                      disabled
                      className={`pl-12 h-12 bg-slate-100/50 border-slate-200 rounded-2xl focus:bg-white text-base! font-normal! opacity-60 grayscale-[0.2] cursor-not-allowed ${
                        errors.nombreCompleto ? "border-red-500 ring-1 ring-red-500/10" : ""
                      }`}
                    />
                  </div>
                  {errors.nombreCompleto && (
                    <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1 uppercase tracking-wider">
                      {errors.nombreCompleto}
                    </p>
                  )}
                </Field>

                <Field>
                  <FieldLabel className="text-[10px] uppercase tracking-[0.15em] font-black text-slate-400 mb-2 block ml-1 break-words">
                    Número de Teléfono
                  </FieldLabel>
                  <div className="relative pointer-events-none">
                    <Phone
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                      size={18}
                    />
                    <Input
                      name="numeroTelefono"
                      value={formData.numeroTelefono}
                      onChange={handleInputChange}
                      readOnly
                      disabled
                      className={`pl-12 h-12 bg-slate-100/50 border-slate-200 rounded-2xl focus:bg-white text-base! font-normal!! opacity-60 grayscale-[0.2] cursor-not-allowed ${
                        errors.numeroTelefono ? "border-red-500 ring-1 ring-red-500/10" : ""
                      }`}
                    />
                  </div>
                  {errors.numeroTelefono && (
                    <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1 uppercase tracking-wider">
                      {errors.numeroTelefono}
                    </p>
                  )}
                </Field>

                <Field>
                  <FieldLabel className="text-[10px] uppercase tracking-[0.15em] font-black text-slate-400 mb-2 block ml-1 break-words">
                    Cargo Profesional
                  </FieldLabel>
                  <div className="relative">
                    <BadgeCheck
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                      size={18}
                    />
                    <Input
                      name="cargoProfesional"
                      value={formData.cargoProfesional}
                      onChange={handleInputChange}
                      className={`pl-12 h-12 bg-slate-50/50 border-slate-200 rounded-2xl focus:bg-white text-base! font-normal!! ${
                        errors.cargoProfesional ? "border-red-500 ring-1 ring-red-500/10" : ""
                      }`}
                    />
                  </div>
                  {errors.cargoProfesional && (
                    <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1 uppercase tracking-wider">
                      {errors.cargoProfesional}
                    </p>
                  )}
                </Field>

                <Field className="md:col-span-1">
                  <FieldLabel className="text-[10px] uppercase tracking-[0.15em] font-black text-slate-400 mb-2 block ml-1 break-words">
                    Correo Electrónico
                  </FieldLabel>
                  <div className="relative pointer-events-none">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                      size={18}
                    />
                    <Input
                      name="correoElectronico"
                      value={formData.correoElectronico}
                      onChange={handleInputChange}
                      readOnly
                      disabled
                      className={`pl-12 h-12 bg-slate-100/50 border-slate-200 rounded-2xl focus:bg-white text-base! font-normal! opacity-60 grayscale-[0.2] cursor-not-allowed ${
                        errors.correoElectronico ? "border-red-500 ring-1 ring-red-500/10" : ""
                      }`}
                    />
                  </div>
                  {errors.correoElectronico && (
                    <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1 uppercase tracking-wider">
                      {errors.correoElectronico}
                    </p>
                  )}
                </Field>

                <Field className="md:col-span-2">
                  <FieldLabel className="text-[10px] uppercase tracking-[0.15em] font-black text-slate-400 mb-2 block ml-1">
                    Bio Profesional
                  </FieldLabel>
                  <div className="relative bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all focus-within:ring-4 focus-within:ring-primary/5 focus-within:border-primary shadow-sm hover:border-slate-300">
                    <MenuBar editor={editor} />
                    <div className="p-0">
                      <EditorContent editor={editor} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 ml-1">
                    <Info size={12} className="text-slate-400" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Este campo soporta formato de texto enriquecido
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-10 ml-1">
                    <Info size={12} className="text-slate-400 size-7!" />
                    <p className="text-sm font-medium text-slate-500 break-words">
                      Si desea modificar la privacidad de poder contactarlo por
                      WhatsApp,{" "}
                      <Link
                        href="/dashboard/settings?tab=privacy&highlight=whatsapp"
                        className="text-primary font-bold hover:underline transition-all"
                      >
                        ¡haga clic aquí!
                      </Link>
                    </p>
                  </div>
                </Field>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              type="button"
              className="h-12 px-12 bg-primary hover:bg-primary/95 text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all transform hover:-translate-y-1 active:scale-[0.98] flex items-center gap-3 uppercase tracking-widest text-sm border-none cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Save className="size-5!" />
              )}
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
