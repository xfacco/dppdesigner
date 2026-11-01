import { GuideIndexPage, guideIndexMetadata } from "@/components/guide/guide-pages";

type Props = { params: Promise<{ locale: string }> };

export const generateMetadata = ({ params }: Props) => guideIndexMetadata(params);

export default function Page({ params }: Props) {
  return <GuideIndexPage params={params} segmentLocale="it" />;
}
