import { Suspense } from "react";
import PublicProfileView from "@/components/profile/PublicProfileView";

type Props = {
  params: Promise<{
    vertical: string;
    documento: string;
  }>;
};

export default async function PublicProfilePage({ params }: Props) {
  const { vertical, documento } = await params;

  return (
    <Suspense fallback={<div className="min-h-screen animate-pulse bg-slate-50" />}>
      <PublicProfileView verticalParam={vertical} documento={documento} />
    </Suspense>
  );
}
