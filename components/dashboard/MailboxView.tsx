"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  Search,
  Mail,
  Trash2,
  Archive,
  ArrowLeft,
  Inbox as InboxIcon,
} from "lucide-react";
import {
  useVertical,
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogTitle,
} from "@nrivera-iimp/ui-kit-iimp";
import clsx from "clsx";
import { toast } from "sonner";

import { usePortalStore, PortalMessage } from "@/store/portal/usePortalStore";
import { useAuthStore } from "@/store/useAuthStore";

export default function MailboxView() {
  const { vertical } = useVertical();
  const [selectedMessage, setSelectedMessage] = useState<PortalMessage | null>(
    null,
  );

  const {
    messages,
    markMessageAsRead,
    toggleArchiveMessage,
    deleteMessage,
    deletePermanentMessage,
  } = usePortalStore();
  const user = useAuthStore((state) => state.user);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "archived" | "deleted">(
    "all",
  );
  const [viewingDetail, setViewingDetail] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<PortalMessage | null>(
    null,
  );

  const verticalFavicon = useMemo(() => {
    switch (vertical) {
      case "gess":
        return "/logos/favicon-gess.png";
      case "perumin":
        return "/logos/favicon-perumin.png";
      case "wmc":
        return "/logos/favicon-wmc.png";
      case "proexplo":
        return "/logos/favicon-iimp.png";
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

  const counts = useMemo(
    () => ({
      all: messages.filter((m) => !m.isArchived && !m.isDeleted).length,
      archived: messages.filter((m) => m.isArchived && !m.isDeleted).length,
      deleted: messages.filter((m) => m.isDeleted).length,
    }),
    [messages],
  );

  const handleSelectMessage = (message: PortalMessage) => {
    setSelectedMessage(message);
    setViewingDetail(true);
    // Mark as read
    if (!message.isRead && user?.siecode) {
      markMessageAsRead(message.id, user.siecode);
    }
  };

  const handleToggleArchive = (id: string) => {
    if (!user?.siecode) return;
    const undo = activeTab === "archived";
    toggleArchiveMessage(id, user.siecode, undo);
    setSelectedMessage(null);
    setViewingDetail(false);
  };

  const handleDelete = (id: string) => {
    const msg = messages.find((m) => m.id === id);
    if (msg) {
      setMessageToDelete(msg);
    }
  };

  const confirmDelete = () => {
    if (!messageToDelete || !user?.siecode) return;

    if (activeTab === "deleted") {
      deletePermanentMessage(messageToDelete.id, user.siecode);
      toast.success("Mensaje eliminado permanentemente");
    } else {
      deleteMessage(messageToDelete.id, user.siecode);
      toast.success("Mensaje movido a eliminados");
    }

    setMessageToDelete(null);
    setSelectedMessage(null);
    setViewingDetail(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-white rounded-3xl !border !border-slate-100 shadow-xl overflow-hidden">
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
        <div className="flex flex-nowrap overflow-x-auto items-center bg-slate-100 p-1 rounded-2xl w-full md:w-auto custom-scrollbar">
          {[
            { id: "all", label: "Todos", count: counts.all },
            { id: "archived", label: "Archivados", count: counts.archived },
            { id: "deleted", label: "Eliminados", count: counts.deleted },
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
              <div className="flex items-center gap-2">
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={clsx(
                      "px-1.5 py-0.5 rounded-md text-[10px] font-black",
                      activeTab === tab.id
                        ? "bg-primary text-white"
                        : "bg-slate-200 text-slate-500",
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </div>
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
            "flex-1 bg-white flex flex-col overflow-hidden transition-all duration-300 z-20",
            !viewingDetail
              ? "hidden md:flex"
              : "flex absolute inset-0 md:relative",
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
                        className="object-cover"
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
              <div className="p-10 text-sm text-slate-600 leading-relaxed font-normal break-words prose prose-slate max-w-none portal-message-content">
                <div
                  dangerouslySetInnerHTML={{ __html: selectedMessage.content }}
                />
              </div>

              {/* Actions Footer */}
              {/* Actions Footer */}
              <div className="mt-auto p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 flex-col md:flex-row">
                {activeTab !== "deleted" ? (
                  <>
                    <Button
                      variant="default"
                      onClick={() => handleToggleArchive(selectedMessage.id)}
                      className="h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-slate-200 transition-all transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest text-xs cursor-pointer border-none w-full md:w-auto"
                    >
                      <Archive size={16} />
                      {activeTab === "all" ? "Archivar" : "Desarchivar"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleDelete(selectedMessage.id);
                      }}
                      className="h-12 px-6 bg-white border border-red-100 text-red-500 font-bold rounded-2xl shadow-sm hover:bg-red-50 hover:border-red-200 transition-all transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest text-xs cursor-pointer w-full md:w-auto"
                    >
                      <Trash2 size={16} /> Eliminar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="default"
                      onClick={() => {
                        handleToggleArchive(selectedMessage.id);
                      }}
                      className="h-12 px-6 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] cursor-pointer border-none md:w-auto w-full"
                    >
                      Restaurar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(selectedMessage.id)}
                      className="h-12 px-6 bg-white border border-red-100 text-red-500 font-bold rounded-2xl shadow-sm hover:bg-red-50 hover:border-red-200 transition-all transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] cursor-pointer md:w-auto w-full"
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

      {/* Delete Confirmation Modal */}
      <Dialog
        open={!!messageToDelete}
        onOpenChange={(open) => !open && setMessageToDelete(null)}
      >
        <DialogContent className="max-w-md rounded-[2rem] p-8 overflow-hidden border-none shadow-2xl bg-white">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center text-red-500 shadow-inner">
              <Trash2 size={40} />
            </div>

            <div className="space-y-2">
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
                {activeTab === "deleted"
                  ? "¿Eliminar permanentemente?"
                  : "¿Mover a eliminados?"}
              </DialogTitle>
              <p className="text-slate-500 font-medium leading-relaxed">
                {activeTab === "deleted"
                  ? "Esta acción no se puede deshacer. El mensaje desaparecerá definitivamente."
                  : "El mensaje se moverá a la pestaña de eliminados y podrás restaurarlo más tarde si lo deseas."}
              </p>
            </div>

            <div className="flex gap-4 w-full pt-4">
              <button
                onClick={() => setMessageToDelete(null)}
                className="flex-1 h-14 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all border-none cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 h-14 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 shadow-lg shadow-red-200 transition-all border-none cursor-pointer"
              >
                {activeTab === "deleted" ? "Eliminar" : "Mover"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
