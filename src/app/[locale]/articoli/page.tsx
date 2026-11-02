import { BlogIndexPage, blogIndexMetadata } from "@/components/blog/blog-pages";

type Props = { params: Promise<{ locale: string }> };

export const generateMetadata = ({ params }: Props) => blogIndexMetadata(params);

export default function Page({ params }: Props) {
  return <BlogIndexPage params={params} segmentLocale="it" />;
}
