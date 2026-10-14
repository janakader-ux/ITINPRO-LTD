import Head from 'next/head';
import Link from 'next/link';
import type { GetStaticProps, GetStaticPaths } from 'next';
import posts from '@/lib/blog-posts.json';
import references from '@/lib/blog-reference.json';

type Post = (typeof posts)[number];
type Reference = (typeof references)[keyof typeof references];
type Props = { post: Post; reference: Reference; related: Post[] };
export const getStaticPaths: GetStaticPaths = () => ({ paths: posts.map(p => ({ params: { slug: p.slug } })), fallback: false });
export const getStaticProps: GetStaticProps<Props> = ({ params }) => {
  const post = posts.find(p => p.slug === params?.slug);
  if (!post) return { notFound: true };
  return { props: { post, reference: references[post.slug as keyof typeof references], related: posts.filter(p => post.related_posts.includes(p.slug)) } };
};
export default function BlogPost({post:p, reference:r, related}:Props) {
  const url=`https://itinpro.uk/blog/${p.slug}`, image=`https://itinpro.uk/images/blog/${p.slug}-scenario.webp`;
  return <>
    <Head>
      <title>{p.seo_title}</title><meta name="description" content={p.meta_description}/>
      <meta name="keywords" content={[p.primary_keyword,...p.secondary_keywords].join(', ')}/>
      <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1"/>
      <link rel="canonical" href={url}/>
      <meta property="og:type" content="article"/><meta property="og:site_name" content="ITIN Pro UK"/><meta property="og:locale" content="en_GB"/>
      <meta property="og:title" content={p.title}/><meta property="og:description" content={p.meta_description}/><meta property="og:url" content={url}/><meta property="og:image" content={image}/><meta property="og:image:alt" content={p.image_scenario.alt}/>
      <meta property="article:published_time" content={p.date_published}/><meta property="article:section" content={p.category}/>
      <meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content={p.title}/><meta name="twitter:description" content={p.meta_description}/><meta name="twitter:image" content={image}/>
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:r.schema}}/>
    </Head>
    <div className="container-premium py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-silver"><Link href="/">Home</Link> › <Link href="/blog">Blog</Link> › {p.category}</nav>
      <article className="blog-post mx-auto max-w-3xl">
        <p className="eyebrow">{p.category}</p><h1 className="mt-4 font-display text-4xl leading-tight sm:text-6xl">{p.title}</h1>
        <p className="mt-6 text-lg leading-8 text-slate-200">{p.hook}</p>
        <aside className="blog-box answer"><h2>Quick answer</h2><p>{p.quick_answer}</p></aside>
        <figure><img src={`/images/blog/${p.slug}-scenario.webp`} alt={p.image_scenario.alt} width={1600} height={900} fetchPriority="high"/></figure>
        <aside className="blog-box story"><h2>Real-life example: {p.scenario.name}, {p.scenario.location}</h2><p>{p.scenario.story}</p></aside>
        <div className="guide-body">{p.sections.map((s,i)=><section key={s.h2}><h2>{s.h2}</h2><div dangerouslySetInnerHTML={{__html:r.sections[i]}}/></section>)}</div>
        {p.treaty_photo&&r.treatyExists&&<figure><img src={`/images/blog/${p.treaty_photo.file}`} alt={p.treaty_photo.alt} width={1600} height={900} loading="lazy"/><figcaption>US–UK tax treaty: {p.treaty_photo.topic}</figcaption></figure>}
        <figure><a href={p.cta.url} className="blog-infographic-link block rounded-3xl" aria-label={`Start your application: ${p.title}`} title="Start your application"><img src={`/images/blog/${p.slug}-infographic.webp`} alt={p.image_infographic.alt} width={1600} height={900} loading="lazy"/></a><figcaption>{p.image_infographic.title}</figcaption><div className="mt-4 text-center"><a href={p.cta.url} className="blog-application-button inline-flex min-h-12 items-center justify-center rounded-full bg-[#15803d] px-5 py-3 font-extrabold text-white transition-colors hover:bg-[#166534] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Start your application →</a></div></figure>
        <div className="mt-8"><h2 className="font-bold">Forms in this guide</h2><div className="mt-3 flex flex-wrap gap-2">{p.forms_mentioned.map(f=><span key={f} className="rounded-full border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-gold">{f}</span>)}</div></div>
        {p.areas_served&&<section className="guide-body"><h2>{p.areas_served_heading||'Areas we regularly visit'}</h2><ul className="mt-4 grid gap-2 sm:grid-cols-2">{p.areas_served.map(a=><li key={a}>{a}</li>)}</ul></section>}
        <section className="guide-body"><h2>Frequently asked questions</h2>{p.faqs.map(f=><div className="mt-6 rounded-2xl border border-white/10 p-5" key={f.q}><h3 className="!mt-0 font-bold text-white">{f.q}</h3><p className="mt-3">{f.a}</p></div>)}</section>
        <aside className="blog-box takeaway"><h2>Practical takeaway</h2><ul className="mt-3 list-disc space-y-2 pl-5">{p.takeaway.map(t=><li key={t}>{t}</li>)}</ul></aside>
        <section className="blog-box cta"><h2>{p.cta.heading}</h2><p>{p.cta.text}</p><a href={p.cta.url} className="gold-button mt-5">{p.cta.button} →</a><p className="text-sm">Prefer to talk? <a href="mailto:Taz@itinpro.uk">Taz@itinpro.uk</a> · <a href="tel:+447864113967">+44 7864 113967</a></p></section>
        <section className="guide-body"><h2>Keep reading</h2><div className="mt-4 grid gap-4"><Link href={p.related_guide_url}>In-depth guide: {p.related_guide_url.split('/').pop()?.replaceAll('-',' ').replace(/^./,c=>c.toUpperCase())}</Link>{related.map(x=><Link href={`/blog/${x.slug}`} key={x.slug}>{x.title}</Link>)}</div></section>
        <p className="mt-10 border-t border-white/10 pt-6 text-sm leading-7 text-silver" dangerouslySetInnerHTML={{__html:r.disclaimer}}/>
      </article>
    </div>
  </>;
}
