import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <div className="mx-auto max-w-3xl px-4 py-24">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <Link href="/" className="mt-4 inline-block text-primary underline">
        {t("back")}
      </Link>
    </div>
  );
}
