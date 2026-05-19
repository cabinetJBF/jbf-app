import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

type SearchParams = Promise<{ from?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  const { from } = await searchParams;

  return (
    <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Cabinet JBF</h1>
        <p className="mt-1 text-sm text-slate-500">
          Connectez-vous pour accéder à l&apos;outil interne.
        </p>
      </div>
      <LoginForm from={from} />
    </div>
  );
}
