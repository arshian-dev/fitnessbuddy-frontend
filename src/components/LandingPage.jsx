import { ArrowRight, Flame, HeartPulse, Activity, Sparkles, Users, Dumbbell } from 'lucide-react';

export default function LandingPage({
  email,
  setEmail,
  name,
  setName,
  registerRole,
  setRegisterRole,
  coachCode,
  setCoachCode,
  showRegister,
  setShowRegister,
  authError,
  authLoading,
  handleLogin,
  handleRegister,
  handleQuickLogin
}) {
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const onRegisterSubmit = (e) => {
    e.preventDefault();
    handleRegister(e);
  };

  return (
    <div className="bg-background text-on-background min-h-screen font-body-md">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-50 flex justify-between items-center w-full px-container-margin py-base md:px-lg max-w-7xl mx-auto bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-base">
          <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>fitness_center</span>
          <span className="font-headline-md text-headline-md text-primary tracking-tight">Fitness Buddy</span>
        </div>
        <nav className="hidden md:flex items-center gap-xl">
          <button onClick={() => scrollToSection('services')} className="text-secondary font-medium hover:text-primary transition-colors font-body-md text-body-md">Programs</button>
          <button onClick={() => scrollToSection('testimonials')} className="text-secondary font-medium hover:text-primary transition-colors font-body-md text-body-md">Success Stories</button>
          <button onClick={() => scrollToSection('auth')} className="text-secondary font-medium hover:text-primary transition-colors font-body-md text-body-md">Portal Access</button>
        </nav>
        <div className="flex items-center gap-md">
          <button onClick={() => scrollToSection('auth')} className="bg-primary text-on-primary px-lg py-sm rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all text-body-md">Sign In</button>
        </div>
      </header>

      <main className="overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative min-h-[750px] flex items-center pt-xl">
          <div className="absolute inset-0 z-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#00685f_0%,transparent_50%)]"></div>
          </div>
          <div className="container mx-auto px-container-margin flex flex-col md:flex-row items-center gap-xl relative z-10 max-w-7xl">
            <div className="flex-1 space-y-lg text-center md:text-left">
              <div className="inline-flex items-center gap-xs bg-primary-container/20 px-md py-xs rounded-full border border-primary/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="font-label-md text-label-md text-primary uppercase tracking-widest">System Active: Beta 2.0</span>
              </div>
              <h1 className="font-headline-xl text-[44px] md:text-headline-xl leading-tight text-on-surface">
                Culturally Adaptive <br />
                <span className="text-primary">Fitness Intelligence</span> <br />
                for South Asians
              </h1>
              <p className="font-body-lg text-body-lg text-secondary max-w-xl mx-auto md:mx-0">
                Bridging clinical precision with athletic energy. Personalized health tracks designed for Desi lifestyles, optimizing nutrition and movement for global standards.
              </p>
              <div className="flex flex-col sm:flex-row gap-md justify-center md:justify-start pt-md">
                <button onClick={() => scrollToSection('auth')} className="bg-primary text-on-primary px-xl py-md rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-primary/20 transition-all text-center">Start Free Assessment</button>
                <button onClick={() => scrollToSection('services')} className="border-2 border-outline text-secondary font-bold px-xl py-md rounded-xl hover:bg-surface-container transition-all text-center">Explore Programs</button>
              </div>
              <div className="flex items-center gap-lg pt-xl justify-center md:justify-start">
                <div className="text-center">
                  <p className="font-stat-display text-[32px] md:text-stat-display text-primary">12k+</p>
                  <p className="font-label-md text-label-md text-secondary">Active Athletes</p>
                </div>
                <div className="w-px h-12 bg-outline-variant"></div>
                <div className="text-center">
                  <p className="font-stat-display text-[32px] md:text-stat-display text-primary">94%</p>
                  <p className="font-label-md text-label-md text-secondary">Success Rate</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 relative w-full max-w-lg">
              <div className="relative z-10 animate-float">
                <img className="w-full h-auto rounded-[32px] shadow-2xl" alt="Fitness Buddy" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKWJGjTBxK1-x0dZdU7Ro0MW8HticljigOXS4q67cxdDxstaCD69_PYdlRqFLMTfbw3GrBUT66KuLXuT_nVhWCGMkORe8BTJcPGIGJnQcX-DlduosekhUwHPGlrCpZk2lQxJ2jS-0Mm_RtYNPjc12xiuuytsKt6AvPZhcc1VS0lfdYNYGGemASBHWWuir7wy2J_ZJptFRh6vf6q6QC46GgYKUxyYweLFVc1HhxphSoY9FNJMbQibBGb8UOLECwKzglPw6vzAwdHA"/>
                {/* Floating Glass Metric Card */}
                <div className="absolute -bottom-8 -left-8 glass-card p-lg rounded-2xl shadow-xl max-w-[200px] hidden md:block">
                  <div className="flex items-center gap-xs mb-xs">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    <span className="font-label-md text-label-md text-primary">Live Insight</span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface font-semibold">AI identified metabolic shift</p>
                  <div className="mt-base bg-primary/10 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-[85%]"></div>
                  </div>
                </div>
              </div>
              {/* Decorative shapes */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border border-primary/10 rounded-full -z-10 animate-pulse"></div>
            </div>
          </div>
        </section>

        {/* Services Bento Grid */}
        <section className="py-xl bg-surface-container-low" id="services">
          <div className="container mx-auto px-container-margin max-w-7xl">
            <div className="text-center mb-xl">
              <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-base">Precision Solutions</h2>
              <p className="font-body-md text-body-md text-secondary max-w-2xl mx-auto">Tailored for the unique health markers of the South Asian diaspora, from metabolic health to injury recovery.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-md">
              {/* Desi Food Swaps */}
              <div className="md:col-span-8 bg-surface rounded-[24px] p-xl border border-outline-variant/30 group hover:shadow-xl transition-all overflow-hidden relative">
                <div className="relative z-10 flex flex-col md:flex-row gap-lg items-center">
                  <div className="flex-1">
                    <span className="material-symbols-outlined text-tertiary text-4xl mb-md">restaurant</span>
                    <h3 className="font-headline-md text-headline-md mb-xs">Desi Food Swaps</h3>
                    <p className="font-body-md text-body-md text-secondary mb-md">Optimize your Paneer and Daal intake without losing the soul of the dish. Macro-matched recipes for muscle growth.</p>
                    <button onClick={() => scrollToSection('auth')} className="flex items-center gap-xs text-primary font-bold hover:gap-md transition-all">View Kitchen Guides <span className="material-symbols-outlined">arrow_forward</span></button>
                  </div>
                  <div className="w-full md:w-1/3 aspect-square rounded-2xl overflow-hidden shadow-lg transform group-hover:scale-105 transition-transform">
                    <img className="w-full h-full object-cover" alt="Desi Swaps" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhEHyNyE9H2SrjfiTFqhk5KzlCW26pbbkxUfrnGwS6u44LsRk80MuTEN2unoDnxdJbcgEb2kYl0kw90JvAmx-UWHzipiOxEbu66eIpfkv0YBQTNVQ9uM--MCHsPbncjEo3qVijzaWQJVHGr3CYaCcaxOFeJ7fDdOwLA6STmyEqqbfzP402jW-lzKriEGzjUODPOrGrjhYOkfXAUR8SP7h9rZQ3Yi4w9ottcdX8GUwonfKTl_lZWnjDTomB8WrjjNMnxY97Tjxuzg"/>
                  </div>
                </div>
              </div>

              {/* AI Assistant */}
              <div className="md:col-span-4 bg-primary text-on-primary rounded-[24px] p-xl flex flex-col justify-between group overflow-hidden relative">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary-container/20 rounded-full"></div>
                <div>
                  <span className="material-symbols-outlined text-4xl mb-md">auto_awesome</span>
                  <h3 className="font-headline-md text-headline-md mb-xs">AI Coach Integration</h3>
                  <p className="font-body-md text-body-md opacity-80">24/7 hyper-personalized chat support for workout adjustments and form checks.</p>
                </div>
                <div className="mt-xl flex items-center justify-between">
                  <span className="font-label-md text-label-md uppercase tracking-widest">Always Online</span>
                  <div className="w-10 h-10 rounded-full border-2 border-on-primary/20 flex items-center justify-center group-hover:bg-on-primary group-hover:text-primary transition-all">
                    <span className="material-symbols-outlined">bolt</span>
                  </div>
                </div>
              </div>

              {/* PCOS Cycle Optimization */}
              <div className="md:col-span-4 bg-surface rounded-[24px] p-xl border border-outline-variant/30 flex flex-col justify-between hover:border-primary/40 transition-colors group">
                <span className="material-symbols-outlined text-primary text-4xl mb-md">cycle</span>
                <div>
                  <h3 className="font-headline-md text-headline-md mb-xs">PCOS Cycle Syncing</h3>
                  <p className="font-body-md text-body-md text-secondary">Manage insulin sensitivity through hormone-aligned workout intensity levels.</p>
                </div>
                <div className="mt-lg">
                  <span className="inline-block bg-primary/5 text-primary text-xs font-bold px-base py-xs rounded">Clinical Track</span>
                </div>
              </div>

              {/* Knee/Joint Rehab */}
              <div className="md:col-span-4 bg-surface rounded-[24px] p-xl border border-outline-variant/30 flex flex-col justify-between hover:border-primary/40 transition-colors group">
                <span className="material-symbols-outlined text-primary text-4xl mb-md">stabilization</span>
                <div>
                  <h3 className="font-headline-md text-headline-md mb-xs">Joint Longevity</h3>
                  <p className="font-body-md text-body-md text-secondary">Corrective routines for traditional South Asian households and long commute recovery.</p>
                </div>
                <div className="mt-lg">
                  <span className="inline-block bg-primary/5 text-primary text-xs font-bold px-base py-xs rounded">Stability Expert</span>
                </div>
              </div>

              {/* Coach Override */}
              <div className="md:col-span-4 bg-surface rounded-[24px] p-xl border border-outline-variant/30 flex flex-col justify-between hover:border-primary/40 transition-colors group">
                <span className="material-symbols-outlined text-primary text-4xl mb-md">manage_accounts</span>
                <div>
                  <h3 className="font-headline-md text-headline-md mb-xs">Coach Override</h3>
                  <p class="font-body-md text-body-md text-secondary">Seamlessly switch from AI guidance to professional human coach oversight.</p>
                </div>
                <div className="mt-lg">
                  <span className="inline-block bg-primary/5 text-primary text-xs font-bold px-base py-xs rounded">Human Touch</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-xl overflow-hidden" id="testimonials">
          <div className="container mx-auto px-container-margin max-w-7xl">
            <h2 className="font-headline-lg text-headline-lg text-center mb-xl text-on-surface">Community Impact</h2>
            <div className="flex flex-col md:flex-row gap-lg">
              {/* Zarrar (ZA) */}
              <div className="flex-1 bg-surface-container p-xl rounded-[24px] relative">
                <div className="absolute -top-4 left-xl bg-primary text-on-primary w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">ZA</div>
                <div className="mb-md pt-base">
                  <div className="flex gap-xs text-tertiary">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </div>
                </div>
                <p className="font-body-lg text-body-lg text-on-surface italic mb-lg">"The food swaps were a game changer. I managed to hit my protein goals without ever giving up my mom's handmade rotis. Down 12kg in 4 months."</p>
                <div>
                  <p className="font-bold text-on-surface">Zarrar Ahmed</p>
                  <p className="text-secondary font-label-md text-label-md">London, UK | Tech Lead</p>
                </div>
              </div>

              {/* Bilal (BS) */}
              <div className="flex-1 bg-surface-container p-xl rounded-[24px] relative">
                <div className="absolute -top-4 left-xl bg-primary text-on-primary w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">BS</div>
                <div className="mb-md pt-base">
                  <div className="flex gap-xs text-tertiary">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star_half</span>
                  </div>
                </div>
                <p className="font-body-lg text-body-lg text-on-surface italic mb-lg">"As someone with chronic knee pain, the rehab programs were so specific. The coach override helped when I needed professional physical therapy advice."</p>
                <div>
                  <p className="font-bold text-on-surface">Bilal Shah</p>
                  <p className="text-secondary font-label-md text-label-md">Dubai, UAE | Entrepreneur</p>
                </div>
              </div>

              {/* Amina (AS) */}
              <div className="flex-1 bg-surface-container p-xl rounded-[24px] relative">
                <div className="absolute -top-4 left-xl bg-primary text-on-primary w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">AS</div>
                <div className="mb-md pt-base">
                  <div className="flex gap-xs text-tertiary">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </div>
                </div>
                <p className="font-body-lg text-body-lg text-on-surface italic mb-lg">"The PCOS tracking is invisible magic. My energy levels have stabilized, and I finally feel like I'm working with my body instead of fighting it."</p>
                <div>
                  <p className="font-bold text-on-surface">Amina Siddiqui</p>
                  <p className="text-secondary font-label-md text-label-md">New Jersey, USA | HR Specialist</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Auth Portal Section */}
        <section className="py-xl bg-on-background relative overflow-hidden text-white" id="auth">
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
            <div className="w-full h-full bg-gradient-to-l from-primary to-transparent"></div>
          </div>
          <div className="container mx-auto px-container-margin max-w-7xl relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-xl items-center">
              <div className="text-on-primary-container text-slate-300">
                <h2 className="font-headline-xl text-headline-xl mb-md text-white">Join the Movement</h2>
                <p className="font-body-lg text-body-lg mb-xl opacity-80">Access your personalized health dashboard and sync with the South Asian fitness community. Disciplined health starts here.</p>
                <div className="space-y-md">
                  <div className="flex gap-md">
                    <div className="w-12 h-12 rounded-xl bg-primary-fixed/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary-fixed">sync</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-white">Real-time Syncing</h4>
                      <p className="text-sm opacity-70">Connects with Wearables &amp; Nutrition Logs.</p>
                    </div>
                  </div>
                  <div className="flex gap-md">
                    <div className="w-12 h-12 rounded-xl bg-primary-fixed/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary-fixed">shield</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-white">HIPAA Compliant</h4>
                      <p className="text-sm opacity-70">Your medical-lite data is secure.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Auth Form Card */}
              <div className="bg-surface text-on-surface rounded-[32px] p-lg md:p-xl shadow-2xl">
                <div className="flex border-b border-outline-variant mb-xl">
                  <button
                    className={`flex-1 pb-md font-bold transition-all ${!showRegister ? 'text-primary border-b-2 border-primary' : 'text-secondary'}`}
                    id="btn-signin"
                    onClick={() => setShowRegister(false)}
                  >
                    Sign In
                  </button>
                  <button
                    className={`flex-1 pb-md font-bold transition-all ${showRegister ? 'text-primary border-b-2 border-primary' : 'text-secondary'}`}
                    id="btn-register"
                    onClick={() => setShowRegister(true)}
                  >
                    Registration
                  </button>
                </div>

                {authError && (
                  <div className="bg-error-container text-on-error-container p-md rounded-xl mb-md text-sm font-semibold flex items-center gap-sm">
                    <span className="material-symbols-outlined text-error">error</span>
                    <span>{authError}</span>
                  </div>
                )}

                {/* Sign In Form */}
                {!showRegister ? (
                  <div className="space-y-lg">
                    <div className="space-y-xs">
                      <label className="font-label-md text-label-md text-on-surface-variant">Email Address</label>
                      <input
                        className="w-full bg-surface-container-low border-outline-variant rounded-xl px-md py-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                        placeholder="e.g. coach@test.com"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      />
                    </div>
                    
                    <button
                      className="w-full bg-primary text-on-primary py-md rounded-xl font-bold text-lg hover:opacity-90 active:scale-95 transition-all"
                      onClick={() => handleLogin()}
                      disabled={authLoading}
                    >
                      {authLoading ? 'Signing In...' : 'Access Dashboard'}
                    </button>

                    <div className="relative py-md">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/30"></div></div>
                      <div className="relative flex justify-center text-xs uppercase"><span class="bg-surface px-md text-secondary">Demo Access</span></div>
                    </div>

                    <div className="flex gap-md">
                      <button
                        className="flex-1 border border-outline-variant rounded-xl py-sm flex items-center justify-center gap-base hover:bg-surface-container-high transition-all"
                        onClick={() => handleQuickLogin('client@test.com')}
                      >
                        <span className="font-bold text-primary text-xs">Test Client</span>
                      </button>
                      <button
                        className="flex-1 border border-outline-variant rounded-xl py-sm flex items-center justify-center gap-base hover:bg-surface-container-high transition-all"
                        onClick={() => handleQuickLogin('coach@test.com')}
                      >
                        <span className="font-bold text-primary text-xs">Coach Portal</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Registration Form */
                  <form onSubmit={onRegisterSubmit} className="space-y-lg">
                    <div className="space-y-xs">
                      <label className="font-label-md text-label-md text-on-surface-variant">Full Name</label>
                      <input
                        className="w-full bg-surface-container-low border-outline-variant rounded-xl px-md py-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                        placeholder="John Doe"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-xs">
                      <label className="font-label-md text-label-md text-on-surface-variant">Email Address</label>
                      <input
                        className="w-full bg-surface-container-low border-outline-variant rounded-xl px-md py-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                        placeholder="name@domain.com"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-xs">
                      <label className="font-label-md text-label-md text-on-surface-variant">Choose Your Path</label>
                      <div className="grid grid-cols-2 gap-sm">
                        <button
                          type="button"
                          className={`py-sm rounded-xl font-bold transition-all border ${registerRole === 'CLIENT' ? 'bg-primary-container text-on-primary-container border-primary' : 'bg-surface-container-low border-outline-variant text-secondary'}`}
                          onClick={() => setRegisterRole('CLIENT')}
                        >
                          Athlete (Client)
                        </button>
                        <button
                          type="button"
                          className={`py-sm rounded-xl font-bold transition-all border ${registerRole === 'COACH' ? 'bg-primary-container text-on-primary-container border-primary' : 'bg-surface-container-low border-outline-variant text-secondary'}`}
                          onClick={() => setRegisterRole('COACH')}
                        >
                          Coach (Professional)
                        </button>
                      </div>
                    </div>
                    {registerRole === 'CLIENT' && (
                      <div className="space-y-xs animate-in fade-in zoom-in duration-300">
                        <label className="font-label-md text-label-md text-on-surface-variant flex items-center gap-xs">
                          <span className="material-symbols-outlined text-[16px] text-tertiary">key</span>
                          Coach Invite Code <span className="text-secondary font-normal text-xs">(Optional)</span>
                        </label>
                        <input
                          className="w-full bg-surface-container-low border-outline-variant rounded-xl px-md py-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                          placeholder="e.g. FIT-A1B2"
                          type="text"
                          value={coachCode}
                          onChange={(e) => setCoachCode(e.target.value.toUpperCase())}
                        />
                      </div>
                    )}
                    <button
                      className="w-full bg-primary text-on-primary py-md rounded-xl font-bold text-lg hover:opacity-90 active:scale-95 transition-all mt-md"
                      type="submit"
                      disabled={authLoading}
                    >
                      {authLoading ? 'Creating...' : 'Create Profile'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-xl px-container-margin grid grid-cols-1 md:grid-cols-2 gap-lg max-w-7xl mx-auto border-t border-outline-variant/50 bg-surface-container-highest">
        <div>
          <div className="flex items-center gap-base mb-md">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>fitness_center</span>
            <span className="font-headline-md text-headline-md text-primary tracking-tight">Fitness Buddy</span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mb-xl max-w-sm">© 2026 Fitness Buddy. Culturally Adaptive Health. Engineered for South Asian performance and global longevity.</p>
        </div>
        <div className="grid grid-cols-2 gap-md">
          <div className="flex flex-col gap-sm">
            <a className="text-on-surface-variant hover:text-primary transition-colors font-label-md" href="#">Privacy Policy</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors font-label-md" href="#">Terms of Service</a>
          </div>
          <div className="flex flex-col gap-sm">
            <a className="text-on-surface-variant hover:text-primary transition-colors font-label-md" href="#">Contact Support</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors font-label-md" href="#">Health Articles</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
