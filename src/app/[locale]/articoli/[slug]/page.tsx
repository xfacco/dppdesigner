import { BlogPostPage, blogPostMetadata } from "@/components/blog/blog-pages";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const generateMetadata = ({ params }: Props) => blogPostMetadata(params);

export default function Page({ params }: Props) {
  return <BlogPostPage params={params} segmentLocale="it" />;
}
