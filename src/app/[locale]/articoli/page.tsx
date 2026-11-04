import { BlogIndexPage, blogIndexMetadata } from "@/components/blog/blog-pages";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string | string[] }> };

export const generateMetadata = ({ params, searchParams }: Props) => blogIndexMetadata(params, searchParams);

export default function Page({ params, searchParams }: Props) {
  return <BlogIndexPage params={params} searchParams={searchParams} segmentLocale="it" />;
}
