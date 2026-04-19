import LoginForm from "@/components/auth/LoginForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-0 md:p-6 lg:p-12 transition-colors duration-500">
      <div className="w-full flex justify-center">
        <LoginForm />
      </div>
    </main>
  );
}

