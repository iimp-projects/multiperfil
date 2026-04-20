"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useVertical, Button, Input } from "@nrivera-iimp/ui-kit-iimp";
import {
  Search,
  Mail,
  Trash2,
  Archive,
  ArrowLeft,
  Inbox as InboxIcon,
} from "lucide-react";
import clsx from "clsx";

interface Message {
  id: string;
  sender: string;
  senderRole: string;
  subject: string;
  preview: string;
  content: string;
  date: string;
  time: string;
  isRead: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  favicon?: string;
  avatar?: string;
}

const mockMessages: Message[] = [
  {
    id: "m1",
    sender: "IIMP - ProExplo 2025",
    senderRole: "Organización",
    subject: "Confirmación de registro y accesos",
    preview:
      "Hola Bryan, te damos el acceso oficial a la plataforma de ProExplo 2025. Aquí encontrarás tus credenciales...",
    content:
      "Hola Bryan,\n\nTe damos el acceso oficial a la plataforma de ProExplo 2025. Aquí encontrarás tus credenciales y el enlace para descargar tu pase digital.\n\nRecuerda revisar el programa del evento para no perderte ninguna charla técnica.\n\nSaludos,\nEquipo IIMP",
    date: "16 Mar",
    time: "10:30 AM",
    isRead: false,
    isArchived: false,
    isDeleted: false,
    favicon: "/logos/favicon-iimp.png",
  },
  {
    id: "m2",
    sender: "WMC 2026",
    senderRole: "Noticias",
    subject: "Nuevas conferencias confirmadas",
    preview:
      "Se han agregado 5 nuevas sesiones técnicas sobre minería sostenible en el World Mining Congress...",
    content:
      "Estimado participante,\n\nNos complace informarle que se han agregado 5 nuevas sesiones técnicas sobre minería sostenible en el World Mining Congress 2026.\n\nAproveche los descuentos de pre-inscripción disponibles hasta fin de mes.\n\nAtentamente,\nComité Organizador WMC",
    date: "15 Mar",
    time: "02:15 PM",
    isRead: true,
    isArchived: false,
    isDeleted: false,
    favicon: "/logos/favicon-wmc.png",
  },
  {
    id: "m3",
    sender: "Soporte Técnico",
    senderRole: "Ayuda",
    subject: "Respuesta a tu solicitud #4452",
    preview:
      "Tu reporte sobre el acceso a los cupones ha sido resuelto. Por favor verifica si ya puedes visualizar...",
    content:
      "Hola,\n\nTu reporte sobre el acceso a los cupones ha sido resuelto. Por favor verifica si ya puedes visualizarlos correctamente en tu panel.\n\nQuedamos atentos a cualquier otro requerimiento.\n\nEquipo de Soporte",
    date: "14 Mar",
    time: "09:00 AM",
    isRead: true,
    isArchived: true,
    isDeleted: false,
    favicon: "/logos/favicon-iimp.png",
  },
];

export default function MailboxView() {
  const { vertical } = useVertical();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "archived" | "deleted">(
    "all",
  );
  const [viewingDetail, setViewingDetail] = useState(false);

  const verticalFavicon = useMemo(() => {
    switch (vertical) {
      case "gess":
        return "/logos/favicon-gess.png";
      case "perumin":
        return "/logos/favicon-perumin.png";
      case "wmc":
        return "/logos/favicon-wmc.png";
      case "proexplo":
        return "/logos/favicon-proexplo.png";
      default:
        return "/logos/favicon-iimp.png";
    }
  }, [vertical]);

  const filteredMessages = messages.filter((m) => {
    const matchesSearch =
      m.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "deleted") {
      return m.isDeleted && matchesSearch;
    } else if (activeTab === "archived") {
      return m.isArchived && !m.isDeleted && matchesSearch;
    } else {
      // 'all' tab
      return !m.isArchived && !m.isDeleted && matchesSearch;
    }
  });

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    setViewingDetail(true);
    // Mark as read
    if (!message.isRead) {
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, isRead: true } : m)),
      );
    }
  };

  const handleToggleArchive = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isArchived: !m.isArchived } : m)),
    );
    setSelectedMessage(null);
    setViewingDetail(false);
  };

  const handleDelete = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    setSelectedMessage(null);
    setViewingDetail(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
      {/* Search Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <Input
            type="text"
            placeholder="Buscar mensajes..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
          {[
            { id: "all", label: "Todos" },
            { id: "archived", label: "Archivados" },
            { id: "deleted", label: "Eliminados" },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() =>
                setActiveTab(tab.id as "all" | "archived" | "deleted")
              }
              className={clsx(
                "flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer h-auto",
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm hover:bg-white"
                  : "text-slate-400 hover:text-slate-600",
              )}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Message List */}
        <div
          className={clsx(
            "w-full md:w-1/3 border-r border-slate-100 flex flex-col overflow-y-auto overscroll-contain scroll-touch transition-all duration-300",
            viewingDetail ? "hidden md:flex" : "flex",
          )}
        >
          {filteredMessages.length > 0 ? (
            filteredMessages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => handleSelectMessage(msg)}
                className={clsx(
                  "p-5 border-b border-slate-50 cursor-pointer transition-all hover:bg-primary/5 relative group",
                  selectedMessage?.id === msg.id ? "bg-blue-50/50" : "",
                  !msg.isRead
                    ? "border-l-4 border-l-primary shadow-sm"
                    : "border-l-4 border-l-transparent",
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={clsx(
                      "text-sm tracking-tight",
                      !msg.isRead
                        ? "font-bold text-slate-900"
                        : "font-bold text-slate-600",
                    )}
                  >
                    {msg.sender}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {msg.date}
                  </span>
                </div>
                <h4
                  className={clsx(
                    "text-sm mb-1 truncate tracking-tight",
                    !msg.isRead
                      ? "font-bold text-slate-800"
                      : "font-medium text-slate-500",
                  )}
                >
                  {msg.subject}
                </h4>
                <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                  {msg.preview}
                </p>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                <Mail size={32} />
              </div>
              <h3 className="text-slate-400 font-bold">No hay mensajes</h3>
              <p className="text-xs text-slate-400 mt-2">
                No encontramos resultados para tu búsqueda.
              </p>
            </div>
          )}
        </div>

        {/* Message Detail */}
        <div
          className={clsx(
            "flex-1 bg-white flex flex-col overflow-hidden transition-all duration-300",
            !viewingDetail ? "hidden md:flex" : "flex",
          )}
        >
          {selectedMessage ? (
            <div className="flex flex-col h-full overflow-y-auto overscroll-contain scroll-touch">
              {/* Detail Header */}
              <div className="p-6 border-b border-slate-50 sticky top-0 bg-slate-50 backdrop-blur-md z-10">
                <div className="flex items-center gap-4 mb-6">
                  <Button
                    variant="ghost"
                    onClick={() => setViewingDetail(false)}
                    className="md:hidden p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 cursor-pointer h-auto"
                  >
                    <ArrowLeft size={20} />
                  </Button>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight break-words">
                    {selectedMessage.subject}
                  </h2>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden relative">
                      <Image
                        src={selectedMessage.favicon || verticalFavicon}
                        alt={selectedMessage.sender}
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 tracking-tight">
                        {selectedMessage.sender}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {selectedMessage.senderRole}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {selectedMessage.date}
                    </p>
                    <p className="text-[10px] font-bold text-slate-300 mt-0.5">
                      {selectedMessage.time}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detail Content */}
              <div className="p-10 whitespace-pre-wrap text-sm text-slate-600 leading-relaxed font-normal break-words">
                {selectedMessage.content}
              </div>

              {/* Actions Footer */}
              {/* Actions Footer */}
              <div className="mt-auto p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                {activeTab !== "deleted" ? (
                  <>
                    <Button
                      variant="default"
                      onClick={() => handleToggleArchive(selectedMessage.id)}
                      className="h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-slate-200 transition-all transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest text-xs cursor-pointer border-none"
                    >
                      <Archive size={16} />
                      {activeTab === "all" ? "Archivar" : "Desarchivar"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMessages((prev) =>
                          prev.map((m) =>
                            m.id === selectedMessage.id
                              ? { ...m, isDeleted: true }
                              : m,
                          ),
                        );
                        setSelectedMessage(null);
                        setViewingDetail(false);
                      }}
                      className="h-12 px-6 bg-white border border-red-100 text-red-500 font-bold rounded-2xl shadow-sm hover:bg-red-50 hover:border-red-200 transition-all transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest text-xs cursor-pointer"
                    >
                      <Trash2 size={16} /> Eliminar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="default"
                      onClick={() => {
                        setMessages((prev) =>
                          prev.map((m) =>
                            m.id === selectedMessage.id
                              ? { ...m, isDeleted: false }
                              : m,
                          ),
                        );
                        setSelectedMessage(null);
                        setViewingDetail(false);
                      }}
                      className="h-12 px-6 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] cursor-pointer border-none"
                    >
                      Restaurar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(selectedMessage.id)}
                      className="h-12 px-6 bg-white border border-red-100 text-red-500 font-bold rounded-2xl shadow-sm hover:bg-red-50 hover:border-red-200 transition-all transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] cursor-pointer"
                    >
                      <Trash2 size={16} /> Eliminar Permanente
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-20">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6 border-4 border-white shadow-inner">
                <InboxIcon size={48} />
              </div>
              <h3 className="text-slate-900 font-black text-lg tracking-tight">
                Selecciona un mensaje
              </h3>
              <p className="text-sm text-slate-400 mt-2 max-w-xs leading-relaxed">
                Haz clic en cualquier mensaje del buzón para leer su contenido
                completo aquí.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
