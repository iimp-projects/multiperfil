import AdminLoginForm from "@/components/auth/AdminLoginForm";

export const metadata = {
  title: "Panel Administrativo – IIMP",
  description: "Acceso restringido al panel de administración Multiperfil V2",
};

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <AdminLoginForm />
    </main>
  );
}
