"use client";

import React, { useEffect, useMemo } from "react";
import { 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck,
  Send,
  Download,
  Share2,
  ChevronRight
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { 
  Card, 
  CardContent, 
  Avatar, 
  AvatarImage, 
  AvatarFallback,
  Badge,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyP,
  Separator
} from "@nrivera-iimp/ui-kit-iimp";
import { getFullImageUrl } from "@/lib/s3-utils";

interface PublicProfileViewProps {
  verticalParam: string;
  documento: string;
}

export default function PublicProfileView({ verticalParam }: PublicProfileViewProps) {
  const { user } = useAuthStore();
  const profileUser = user;
  const vertical = verticalParam.toLowerCase();

  // Sync vertical with document attribute for global theming
  useEffect(() => {
    if (vertical) {
      document.documentElement.setAttribute('data-vertical', vertical);
      document.documentElement.className = `vert-${vertical}`;
      
      document.title = `${profileUser?.nombres || "Alex Mendez"} ${profileUser?.apellidoPaterno || ""} | Perfil Profesional`;
    }
  }, [vertical, profileUser]);

  const themeConfig = useMemo(() => {
    switch (vertical) {
      case "gess": return {
        gradient: "from-blue-600 to-blue-800",
        primary: "bg-blue-600",
        text: "text-blue-600",
        label: "GESS 2026"
      };
      case "wmc": return {
        gradient: "from-purple-600 to-indigo-900",
        primary: "bg-indigo-700",
        text: "text-indigo-700",
        label: "WMC 2026"
      };
      default: return {
        gradient: "from-orange-500 to-red-700",
        primary: "bg-orange-600",
        text: "text-orange-600",
        label: "PROEXPLO 2026"
      };
    }
  }, [vertical]);

  const userBio = profileUser?.bio || "Senior Geologist with over 15 years of experience in greenfield exploration and structural geology. Specialized in Andean porphyry systems and remote sensing data integration. Lead researcher for the 2026 Northern Belt mapping project.";

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans selection:bg-primary/20 flex flex-col items-center justify-center p-4 md:p-8">
      
      {/* Container to center and control max width */}
      <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* Main Profile Card */}
        <Card className="overflow-hidden border-none shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-4xl">
          
          {/* Header Section with Gradient and Pattern */}
          <div className={`relative h-48 md:h-56 bg-linear-to-br ${themeConfig.gradient} overflow-hidden`}>
            {/* Subtle Pattern Overlay */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-size-[20px_20px]" />
            
            {/* Verification Status */}
            <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <ShieldCheck size={14} className="text-white" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Verified Executive</span>
            </div>

            {/* Sharing Action */}
            <button
              className="absolute top-6 left-6 p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/20 transition-colors h-10 w-10 flex items-center justify-center cursor-pointer"
            >
              <Share2 size={16} />
            </button>
          </div>

          <CardContent className="px-6 md:px-12 pb-12 relative flex flex-col items-center text-center">
            
            {/* Floating Avatar */}
            <div className="relative -mt-20 mb-6">
              <div className="relative p-1.5 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-slate-900/10">
                <Avatar className="w-32 h-32 md:w-40 md:h-40 rounded-[2.2rem]">
                  <AvatarImage 
                    src={getFullImageUrl(profileUser?.picture) || `https://ui-avatars.com/api/?name=${profileUser?.nombres || "Alex"}+${profileUser?.apellidoPaterno || "Mendez"}&background=random&size=400&color=fff&font-size=0.33`} 
                    alt="Profile Picture"
                    className="object-cover"
                  />
                  <AvatarFallback className="text-4xl font-black">
                    {profileUser?.nombres?.[0]}{profileUser?.apellidoPaterno?.[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              {/* Online Status */}
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-white dark:border-slate-900 rounded-full shadow-md" />
            </div>

            {/* Identity Info */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center justify-center gap-2">
                <TypographyH2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight border-none">
                  {profileUser?.nombres || "Ing. Alex Mendez"} {profileUser?.apellidoPaterno || ""}
                </TypographyH2>
                <Badge variant="outline" className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-wider h-6">
                  Senior
                </Badge>
              </div>
              <TypographyP className="text-lg font-bold text-slate-500 dark:text-slate-400">
                {profileUser?.cargo || "Senior Exploration Geologist"}
              </TypographyP>
            </div>

            {/* Professional Bio Section */}
            <div className="w-full text-left space-y-4 mb-10">
              <div className="flex items-center gap-3">
                <TypographyH4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Biografía Profesional
                </TypographyH4>
                <Separator className="flex-1 opacity-50" />
              </div>
              <TypographyP className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                &ldquo;{userBio}&rdquo;
              </TypographyP>
            </div>

            {/* Contact Details Section */}
            <div className="w-full space-y-4 mb-10">
              <div className="flex items-center gap-3">
                <TypographyH4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Información de Contacto
                </TypographyH4>
                <Separator className="flex-1 opacity-50" />
              </div>
              
              <div className="grid grid-cols-1 gap-4 text-left">
                {/* Email Item */}
                <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group hover:border-primary/30 transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                    <Mail size={20} />
                  </div>
                  <div className="flex-1">
                    <TypographyH4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      Correo electrónico
                    </TypographyH4>
                    <TypographyP className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {profileUser?.email || "alex.mendez@proexplo2026.com"}
                    </TypographyP>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
                </div>

                {/* Phone Item */}
                <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group hover:border-primary/30 transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                    <Phone size={20} />
                  </div>
                  <div className="flex-1">
                    <TypographyH4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      Nro de telefono
                    </TypographyH4>
                    <TypographyP className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {profileUser?.telefono || profileUser?.celular || "+51 987 654 321"}
                    </TypographyP>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
                </div>

                {/* Location Item */}
                <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group hover:border-primary/30 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                    <MapPin size={20} />
                  </div>
                  <div className="flex-1">
                    <TypographyH4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      Ubicación / oficina
                    </TypographyH4>
                    <TypographyP className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Edificio Capital, San Isidro
                    </TypographyP>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="w-full flex flex-col sm:flex-row gap-4 pt-4">
              <button className="flex-1 h-12 rounded-full font-black uppercase tracking-wider text-xs shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 bg-primary text-white border-none flex items-center justify-center cursor-pointer">
                <Send size={16} className="mr-2" />
                Enviar Mensaje
              </button>
              <button className="flex-1 h-12 rounded-full font-black uppercase tracking-wider text-xs border-2 border-slate-200 bg-transparent transition-all hover:bg-slate-50 hover:scale-[1.02] active:scale-95 flex items-center justify-center cursor-pointer">
                <Download size={16} className="mr-2" />
                Vcard
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Branding Footer */}
        <div className="mt-8 text-center space-y-4">
          <div className="inline-flex flex-col items-center">
             <TypographyH3 className="text-base font-black text-slate-900 dark:text-white tracking-widest uppercase border-none">
                {themeConfig.label}
             </TypographyH3>
             <TypographyP className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">
               Documento Oficial de Presentación Corporativa • Confidencial
             </TypographyP>
          </div>
          
          <div className="flex justify-center gap-6 mt-6 opacity-40 hover:opacity-100 transition-opacity">
            <button className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors h-auto p-0 bg-transparent border-none cursor-pointer">Politicas</button>
            <div className="w-1 h-1 bg-slate-300 rounded-full my-auto" />
            <button className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors h-auto p-0 bg-transparent border-none cursor-pointer">Ayuda</button>
            <div className="w-1 h-1 bg-slate-300 rounded-full my-auto" />
            <button className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors h-auto p-0 bg-transparent border-none cursor-pointer">IIMP Web</button>
          </div>

          <TypographyP className="text-[8px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-[0.5em] pt-4">
            Integrated Data Engineering by IIMP © {new Date().getFullYear()}
          </TypographyP>
        </div>
      </div>
    </div>
  );
}
