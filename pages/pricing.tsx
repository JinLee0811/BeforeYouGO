export default function Pricing() {
  return (
    <div className='min-h-screen'>
      <div className='mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-10 text-center'>
          <p className='byg-chip'>
            Pricing is in progress
          </p>
          <h1 className='byg-title mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl'>
            Choose how deep you want to go
          </h1>
          <p className='mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base'>
            The free tier is fully available for this portfolio demo. Premium plans and pricing
            will be added later - for now, higher tiers are preview-only.
          </p>
        </div>

        {/* Plans */}
        <div className='grid gap-6 lg:grid-cols-3'>
          {/* Free plan */}
          <div className='byg-panel relative flex flex-col p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h2 className='byg-title text-lg font-semibold text-slate-900'>Free</h2>
                <p className='mt-1 text-xs uppercase tracking-wide text-emerald-500'>
                  Current demo plan
                </p>
              </div>
              <span className='rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700'>
                Live now
              </span>
            </div>
            <p className='mb-4 text-sm text-slate-600'>
              Try the core experience: search a restaurant and view a clean AI-powered basic
              summary of real Google reviews.
            </p>
            <div className='mb-4'>
              <p className='text-2xl font-semibold text-slate-900'>$0</p>
              <p className='mt-1 text-xs text-slate-500'>Pricing will be adjusted later.</p>
            </div>
            <ul className='mb-6 space-y-2 text-sm text-slate-700'>
              <li>• Basic AI review summary</li>
              <li>• Average rating & sentiment overview</li>
              <li>• Sample photos from Google Places</li>
              <li>• Ideal for quick portfolio demos</li>
            </ul>
            <button
              disabled
              className='mt-auto w-full cursor-default rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-slate-950 opacity-90'>
              Already active in this demo
            </button>
          </div>

          {/* Premium plan */}
          <div className='byg-panel-soft relative flex flex-col p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h2 className='byg-title text-lg font-semibold text-slate-900'>Premium</h2>
                <p className='mt-1 text-xs uppercase tracking-wide text-indigo-500'>
                  Detailed analysis
                </p>
              </div>
              <span className='rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-500'>
                Coming soon
              </span>
            </div>
            <p className='mb-4 text-sm text-slate-600'>
              Unlock a deeper breakdown of what people actually say: keywords, menu items, and
              recommended dishes.
            </p>
            <div className='mb-4'>
              <p className='text-2xl font-semibold text-slate-900'>TBD</p>
              <p className='mt-1 text-xs text-slate-500'>Pricing and limits will be defined later.</p>
            </div>
            <ul className='mb-6 space-y-2 text-sm text-slate-700'>
              <li>• Everything in Free</li>
              <li>• Positive & negative keyword extraction</li>
              <li>• Mentioned menu items overview</li>
              <li>• Recommended dishes based on reviews</li>
            </ul>
            <button
              disabled
              className='mt-auto w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 py-2.5 text-sm font-medium text-slate-500'>
              Premium plan is not available yet
            </button>
          </div>

          {/* Pro plan */}
          <div className='byg-panel-soft relative flex flex-col p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h2 className='byg-title text-lg font-semibold text-slate-900'>Pro</h2>
                <p className='mt-1 text-xs uppercase tracking-wide text-fuchsia-500'>
                  Power users & teams
                </p>
              </div>
              <span className='rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-500'>
                Concept only
              </span>
            </div>
            <p className='mb-4 text-sm text-slate-600'>
              Designed as a future upgrade: manage favorites, add your own notes, and keep a
              private review log per place.
            </p>
            <div className='mb-4'>
              <p className='text-2xl font-semibold text-slate-900'>TBD</p>
              <p className='mt-1 text-xs text-slate-500'>Advanced collaboration features planned.</p>
            </div>
            <ul className='mb-6 space-y-2 text-sm text-slate-700'>
              <li>• Everything in Premium</li>
              <li>• Favorites / bookmark management</li>
              <li>• Personal notes & custom comments</li>
              <li>• Future team / workspace features</li>
            </ul>
            <button
              disabled
              className='mt-auto w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 py-2.5 text-sm font-medium text-slate-500'>
              Pro plan is not available yet
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p className='mx-auto mt-10 max-w-2xl text-center text-xs text-slate-500'>
          This page is part of a personal portfolio project. Actual billing, authentication, and
          subscription management are intentionally not implemented yet. Prices and quotas will be
          defined later if this evolves into a real product.
        </p>
      </div>
    </div>
  );
}
