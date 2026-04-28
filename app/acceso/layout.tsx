import { ReactNode } from "react";
import AccesoShell from "@/components/acceso/AccesoShell";

export default function AccesoLayout({ children }: { children: ReactNode }) {
  return <AccesoShell>{children}</AccesoShell>;
}
