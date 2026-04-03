import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";

const MESSAGES: Record<
  string,
  { title: string; description: string; hint?: string }
> = {
  quota: {
    title: "Daily analysis limit",
    description:
      "You’ve used all free analyses for today, or we couldn’t confirm your allowance. Try again tomorrow, or see pricing if you’d like more.",
  },
  reviews: {
    title: "No reviews available for this place",
    description:
      "Google Places may not have public reviews for this listing yet, or none could be fetched.",
  },
  summary: {
    title: "We couldn’t generate a summary",
    description: "Please try again in a moment, or search for a different restaurant.",
  },
  analyze: {
    title: "We couldn’t finish the detailed analysis",
    description:
      "Check your AI provider (OpenAI, Anthropic, or Gemini) API key and billing, and your database connection, then try again.",
    hint: "OpenAI: set OPENAI_API_KEY and OPENAI_MODEL (e.g. gpt-4o-mini) in .env.local. Or use Anthropic/Gemini; Gemini 403 often means HTTP referrer restrictions on the key—use a server key or OpenAI.",
  },
  auth: {
    title: "Sign in required",
    description: "Review analysis is available after you sign in.",
  },
  parse: {
    title: "We couldn’t read the server response",
    description: "Check your network connection and deployment, then try again.",
  },
  cancelled: {
    title: "Analysis was cancelled",
    description: "You can start a new search and run analysis again.",
  },
  unknown: {
    title: "Something went wrong",
    description: "Please try again in a moment.",
  },
};

/**
 * User-facing errors from search / analysis flows. Optional ?d= carries a short debug string (dev only).
 */
export default function AnalysisErrorPage() {
  const router = useRouter();
  const reason = typeof router.query.reason === "string" ? router.query.reason : "unknown";
  const encoded = typeof router.query.d === "string" ? router.query.d : "";
  const detail = useMemo(() => {
    if (!encoded) return "";
    try {
      return decodeURIComponent(encoded);
    } catch {
      return "";
    }
  }, [encoded]);

  const msg = MESSAGES[reason] ?? MESSAGES.unknown;

  return (
    <>
      <Head>
        <title>Analysis unavailable | Before You Go</title>
      </Head>
      <div className='mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-16 text-center'>
        <p className='text-sm font-semibold uppercase tracking-wide text-indigo-600'>Before You Go</p>
        <h1 className='mt-3 text-2xl font-semibold text-slate-900'>{msg.title}</h1>
        <p className='mt-4 text-slate-600'>{msg.description}</p>
        {msg.hint && (
          <p className='mt-4 rounded-xl border border-amber-100 bg-amber-50/90 p-4 text-left text-sm text-amber-950'>
            {msg.hint}
          </p>
        )}
        {process.env.NODE_ENV === "development" && detail && (
          <pre className='mt-6 max-h-40 overflow-auto rounded-lg bg-slate-100 p-3 text-left text-xs text-slate-700'>
            {detail}
          </pre>
        )}
        <div className='mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center'>
          <Link
            href='/search'
            className='inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700'>
            Back to search
          </Link>
          <Link
            href='/'
            className='inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50'>
            Home
          </Link>
        </div>
      </div>
    </>
  );
}
