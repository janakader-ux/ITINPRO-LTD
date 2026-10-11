import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import guides from '@/lib/guides.json';
import { guideImage } from '@/lib/site';
import { categoryForGuide, getItinCategory, formatItinFee, itinFeeScope, additionalChargesNotice, otherCategoryNotice } from '@/lib/itin-pricing';
import { guideFaqs, guideKeywords, normaliseGuideHtml } from '@/lib/guide-content';
import { GeoFAQAccordion } from '@/components/GeoFAQAccordion';
import { AcceptableDocumentsTable } from '@/components/AcceptableDocumentsTable';
import { GuideVisualSummary } from '@/components/GuideVisualSummary';

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = guides.find((item) => item.slug === slug);
  if (!guide) return {};
  const image = guideImage(guide.category, guide.slug);
  return {
    title: guide.title,
    description: guide.description,
    keywords: guideKeywords(guide.slug, guide.title),
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: { title: guide.title, description: guide.description, type: 'article', images: [image] },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = guides.find((item) => item.slug === slug);
  if (!guide) notFound();

  const image = guideImage(guide.category, guide.slug);
  const categoryId = categoryForGuide(guide.slug);
  const feeCategory = categoryId ? getItinCategory(categoryId) : undefined;
  const articleFaqs = guideFaqs(guide.slug, guide.title);
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    image: `https://itinpro.uk${image}`,
    author: { '@type': 'Organization', name: 'ITIN Pro UK' },
    publisher: { '@type': 'Organization', name: 'ITIN Pro UK' },
    dateModified: '2026-10-11',
    mainEntityOfPage: `https://itinpro.uk/guides/${guide.slug}`,
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://itinpro.uk/' },
      { '@type': 'ListItem', position: 2, name: 'ITIN Guides & FAQs', item: 'https://itinpro.uk/guides' },
      { '@type': 'ListItem', position: 3, name: guide.title, item: `https://itinpro.uk/guides/${guide.slug}` },
    ],
  };

  return (
    <article className="pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <header className="container-premium pt-10 sm:pt-14">
        <Link href="/guides" className="eyebrow">ITIN Guides / FAQs</Link>
        <div className="relative mt-7 aspect-[3/2] overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
          <Image src={image} alt={`${guide.title} — ITIN Pro UK guide`} fill priority sizes="(max-width: 1280px) 100vw, 1200px" className="object-cover" />
        </div>
        <div className="mx-auto max-w-4xl py-10 text-center">
          <p className="text-sm font-bold text-gold">{guide.category}</p>
          <h1 className="mt-3 font-display text-4xl leading-tight sm:text-6xl">{guide.title}</h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-200">{guide.description}</p>
        </div>
      </header>

      <GuideVisualSummary slug={guide.slug} />
      <div className="container-premium">
        <div className="guide-body mx-auto max-w-3xl py-14" dangerouslySetInnerHTML={{ __html: normaliseGuideHtml(guide.body) }} />
        <aside className="mx-auto max-w-3xl rounded-3xl border border-emerald/30 bg-emerald/10 p-6">
          <p className="font-bold text-white">Remote CAA document rule</p>
          <p className="mt-2 leading-7 text-slate-200">A video interview may be used, but the CAA must have the original identification document or an issuing-agency certified copy in their possession during the interview. Remote applicants can use an agreed secure delivery and return process.</p>
        </aside>
      </div>
      {guide.slug === 'itin-acceptable-documents-passport' && <AcceptableDocumentsTable />}
      <GeoFAQAccordion items={articleFaqs} />
      {feeCategory && <aside className="container-premium py-8"><div className="mx-auto max-w-3xl rounded-3xl border border-gold/30 p-6"><h2 className="text-xl font-bold">ITIN service fee</h2><p className="mt-3 text-gold">{formatItinFee(feeCategory.amount)}</p><p className="mt-3 leading-7 text-silver">{itinFeeScope}</p><p className="mt-3 leading-7 text-silver">{additionalChargesNotice}</p>{feeCategory.id === 'other' && <p className="mt-3 leading-7 text-silver">{otherCategoryNotice}</p>}{feeCategory.id === 'llc-bank-account' && <p className="mt-3 leading-7 text-silver">This category is for LLC owners with a US bank account. You must already have an LLC and its EIN number.</p>}{feeCategory.id === 'prepared-1040nr' && <p className="mt-3 leading-7 text-silver">The £395 fee applies only when your 1040-NR tax return is already prepared.</p>}<Link className="gold-button mt-5" href={`/?service=${feeCategory.id}#enquiry`}>Enquire about this service</Link></div></aside>}
      <div className="container-premium">
        <div className="mx-auto max-w-3xl border-t border-white/10 pt-8 text-sm leading-6 text-silver">General information only. Rules and forms change. ITIN Pro is independent and is not the IRS. The IRS decides whether to issue an ITIN. <Link className="text-gold underline" href="/#enquiry">Discuss your facts with us.</Link></div>
      </div>
    </article>
  );
}
