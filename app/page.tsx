import { cookies } from "next/headers";
import LoginForm from "@/components/auth/LoginForm";
import { parseGoogTransCookieValue } from "@/lib/lang";

export default async function Home() {
  const cookieStore = await cookies();
  const lang = parseGoogTransCookieValue(cookieStore.get("googtrans")?.value);

  return (
    <main className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-0 md:p-6 lg:p-12 transition-colors duration-500">
      <div className="w-full flex justify-center">
        <LoginForm initialLang={lang} />
      </div>
    </main>
  );
}

