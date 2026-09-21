import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getSession();

  // Redirect to dashboard if logged in
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#060b19] font-sans selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="w-full border-b border-white/5 bg-[#060b19]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span className="text-xl font-bold text-white tracking-tight">LOOP AI</span>
              <span className="block text-[10px] text-slate-400 font-medium tracking-wide uppercase">Customer Feedback Intelligence</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#" className="text-indigo-400 border-b-2 border-indigo-400 pb-1">Home</Link>
            <Link href="#features" className="text-slate-300 hover:text-white transition-colors pb-1">Features</Link>
            <Link href="#about" className="text-slate-300 hover:text-white transition-colors pb-1">About</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium px-5 py-2.5 text-white border border-white/20 rounded-full hover:bg-white/10 transition-colors">
              Login
            </Link>
            <Link href="/signup" className="text-sm font-medium px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white rounded-full transition-all shadow-lg shadow-purple-500/25">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        {/* Background Decorative Blobs */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">AI Powered</span>
              <span className="w-1 h-1 rounded-full bg-slate-600"></span>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Smarter Feedback</span>
              <span className="w-1 h-1 rounded-full bg-slate-600"></span>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Better Decisions</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-6 tracking-tight">
              Turn Feedback<br />
              Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Action</span>
            </h1>
            
            <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-lg">
              LOOP AI helps you collect, analyze and understand customer feedback with the power of AI. Get valuable insights, find key themes, and make data-driven decisions — all in one place.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup" className="inline-flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-full hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
                Get Started Free &rarr;
              </Link>
              <Link href="#" className="inline-flex items-center justify-center px-8 py-3.5 bg-white/5 text-white font-medium border border-white/10 rounded-full hover:bg-white/10 transition-colors gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Watch Demo
              </Link>
            </div>
          </div>

          {/* Dashboard Mockup (Stylized CSS version) */}
          <div className="relative mt-8 lg:mt-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-3xl -z-10 rounded-full"></div>
            <div className="w-full aspect-[16/11] bg-[#0c1428] rounded-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col transform transition-transform hover:scale-[1.02] duration-500">
              {/* Window Header */}
              <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 bg-[#080d1a]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/90"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/90"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/90"></div>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">Y</div>
                  <span className="text-[10px] text-slate-300 font-medium pr-1">Yash Varmora</span>
                  <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              
              <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-44 border-r border-white/5 bg-[#0a1122] flex flex-col">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <span className="text-sm font-bold text-white tracking-tight">LOOP AI</span>
                    </div>
                    <nav className="space-y-1">
                      {[
                        { icon: "🏠", label: "Dashboard", active: true },
                        { icon: "💬", label: "Feedback" },
                        { icon: "📊", label: "Analytics" },
                        { icon: "🧠", label: "Theme Intelligence" },
                        { icon: "❓", label: "Ask LOOP" },
                        { icon: "📄", label: "Reports" },
                      ].map((item, i) => (
                        <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${item.active ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400'}`}>
                          <span className="text-sm">{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </nav>
                  </div>
                  <div className="mt-auto p-4 border-t border-white/5">
                    <div className="text-[10px] text-slate-500 mb-1">Workspace</div>
                    <div className="flex items-center justify-between text-xs text-slate-300 bg-white/5 px-2 py-1.5 rounded border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-[8px]">M</div>
                        <span className="text-[10px]">My Workspace</span>
                      </div>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
                
                {/* Main Dashboard Area */}
                <div className="flex-1 p-5 bg-[#0c1428] flex flex-col gap-5 overflow-hidden">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-0.5">Good morning, Yash 👋</h3>
                    <p className="text-[10px] text-slate-400">Here's what's happening with your feedback today.</p>
                  </div>
                  
                  {/* KPI Cards */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { title: 'Total Feedback', v: '248', p: '+12%', c: 'text-emerald-400', i: '📈' }, 
                      { title: 'Positive', v: '168', p: '+18%', c: 'text-emerald-400', i: '😊' }, 
                      { title: 'Negative', v: '52', p: '↓ 7%', c: 'text-red-400', i: '😞' }, 
                      { title: 'Neutral', v: '28', p: '+5%', c: 'text-emerald-400', i: '😐' }
                    ].map((kpi, i) => (
                      <div key={i} className="bg-[#111c35] border border-white/5 rounded-xl p-3 flex flex-col shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] bg-white/5 p-1 rounded">{kpi.i}</span>
                          <span className="text-[9px] text-slate-400 font-medium">{kpi.title}</span>
                        </div>
                        <div className="text-xl font-bold text-white mb-1 leading-none">{kpi.v}</div>
                        <div className={`text-[9px] font-medium ${kpi.c}`}>{kpi.p}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 flex-1">
                    {/* Chart area */}
                    <div className="col-span-2 bg-[#111c35] border border-white/5 rounded-xl p-4 flex flex-col relative overflow-hidden h-full">
                      <div className="flex justify-between items-center mb-4 relative z-10">
                        <div className="text-xs font-bold text-white">Feedback Trends</div>
                        <div className="flex gap-3 text-[9px] text-slate-400">
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Positive</span>
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Negative</span>
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Neutral</span>
                        </div>
                      </div>
                      
                      {/* Grid Lines */}
                      <div className="absolute inset-x-4 top-12 bottom-6 flex flex-col justify-between z-0">
                        {[80, 60, 40, 20, 0].map(v => (
                          <div key={v} className="flex items-center gap-2">
                            <span className="text-[8px] text-slate-500 w-3 text-right">{v}</span>
                            <div className="h-px bg-white/5 flex-1"></div>
                          </div>
                        ))}
                      </div>

                      <div className="flex-1 relative z-10 ml-5 mb-1 mt-1">
                        <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                          <path d="M0,70 L15,40 L30,50 L45,20 L60,30 L75,10 L90,25 L100,5" fill="none" stroke="#60a5fa" strokeWidth="1.5" vectorEffect="non-scaling-stroke" className="drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                          <path d="M0,90 L15,85 L30,95 L45,70 L60,80 L75,60 L90,90 L100,85" fill="none" stroke="#f87171" strokeWidth="1.5" vectorEffect="non-scaling-stroke" className="drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
                          <path d="M0,80 L15,70 L30,85 L45,60 L60,65 L75,50 L90,75 L100,60" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
                        </svg>
                      </div>
                      
                      {/* X Axis */}
                      <div className="flex justify-between ml-5 text-[8px] text-slate-500 relative z-10">
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                      </div>
                    </div>

                    {/* Top Themes */}
                    <div className="col-span-1 bg-[#111c35] border border-white/5 rounded-xl p-3 flex flex-col h-full">
                      <div className="text-xs font-bold text-white mb-3">Top Themes</div>
                      <div className="space-y-2 flex-1 flex flex-col justify-between">
                        {[
                          { l: 'Product Quality', v: 48, c: 'bg-blue-400' },
                          { l: 'Delivery', v: 32, c: 'bg-cyan-400' },
                          { l: 'Customer Support', v: 26, c: 'bg-yellow-400' },
                          { l: 'Pricing', v: 18, c: 'bg-orange-400' },
                          { l: 'Website Exp', v: 14, c: 'bg-purple-400' }
                        ].map((t, i) => (
                          <div key={i} className="flex items-center justify-between group">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${t.c}`}></div>
                              <span className="text-[9px] text-slate-300 group-hover:text-white transition-colors">{t.l}</span>
                            </div>
                            <span className="text-[9px] font-medium text-white">{t.v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h4 className="text-sm font-bold text-indigo-600 tracking-widest uppercase mb-4">Powerful Features</h4>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">
              Everything You Need for Better Insights
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              From feedback collection to AI-driven analysis, LOOP AI gives you the complete picture of what your customers really think.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {[
              { title: "AI Classification", desc: "Automatically categorize feedback using Gemini AI and find key topics.", icon: "🤖", color: "text-blue-500", bg: "bg-blue-100" },
              { title: "Theme Intelligence", desc: "Discover themes, link related feedback, and detect trends & spikes.", icon: "🏷️", color: "text-purple-500", bg: "bg-purple-100" },
              { title: "Advanced Analytics", desc: "Get clear visuals and insights with easy-to-understand charts and reports.", icon: "📊", color: "text-green-500", bg: "bg-green-100" },
              { title: "Ask LOOP", desc: "Ask questions in natural language and get answers with citations.", icon: "💬", color: "text-pink-500", bg: "bg-pink-100" },
              { title: "VoC Reports", desc: "Generate professional Voice of Customer reports in seconds.", icon: "📄", color: "text-cyan-500", bg: "bg-cyan-100" }
            ].map((feature, i) => (
              <div key={i} className="text-center flex flex-col items-center">
                <div className={`w-16 h-16 ${feature.bg} rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple Steps Section */}
      <section id="about" className="bg-[#060b19] py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h4 className="text-sm font-bold text-indigo-400 tracking-widest uppercase mb-4">Simple Steps</h4>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
              Get Insights in <span className="text-blue-400">3 Easy Steps</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-6 left-[15%] right-[15%] h-px bg-white/10 z-0"></div>

            {[
              { step: 1, title: "Collect Feedback", desc: "Gather customer feedback from multiple sources in one place." },
              { step: 2, title: "Analyze with AI", desc: "Let AI find themes, trends and key insights automatically." },
              { step: 3, title: "Take Action", desc: "Make better decisions and improve customer experience." }
            ].map((s) => (
              <div key={s.step} className="relative z-10 flex flex-col items-center sm:flex-row sm:items-start text-center sm:text-left gap-6">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center text-xl font-bold shrink-0 shadow-lg shadow-blue-500/10">
                  {s.step}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer id="contact" className="bg-[#040813] py-8 border-t border-white/5 text-center">
        <p className="text-sm text-slate-500">
          LOOP AI • Customer Feedback Intelligence • Build a better tomorrow, together.
        </p>
      </footer>
    </div>
  );
}
