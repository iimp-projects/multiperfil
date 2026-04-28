import AdminRecoveryForm from "@/components/auth/AdminRecoveryForm";

export const metadata = {
  title: "Recuperar Contraseña – Panel Admin IIMP",
  description: "Restablece el acceso a tu cuenta de administrador",
};

export default function AdminRecoveryPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <AdminRecoveryForm />
    </main>
  );
}
