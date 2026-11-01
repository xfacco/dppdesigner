import { GuideArticlePage, guideArticleMetadata } from "@/components/guide/guide-pages";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const generateMetadata = ({ params }: Props) => guideArticleMetadata(params);

export default function Page({ params }: Props) {
  return <GuideArticlePage params={params} segmentLocale="en" />;
}
