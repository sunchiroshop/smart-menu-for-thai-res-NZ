'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
  Sparkles,
  QrCode,
  Globe,
  Zap,
  Shield,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  ArrowRight,
  Star,
  Menu,
  Upload,
  BarChart3,
  Wand2,
  Languages,
  Smartphone,
  ChevronRight,
  Play,
  X
} from 'lucide-react';

export default function HomePage() {
  const [activeEnhancement, setActiveEnhancement] = useState(0);
  const [showComparison, setShowComparison] = useState<number | null>(null);

  // Before/After enhancement examples - Real examples from our AI
  const enhancementExamples = [
    {
      id: 1,
      name: 'Sweet & Sour Chicken',
      cuisine: 'Chinese',
      before: '/images/showcase/sweet_sour_before.jpg',
      after: '/images/showcase/sweet_sour_after.png',
      description: 'Plain green background → Professional restaurant setting',
      isReal: true // Real before/after - no CSS filters
    },
    {
      id: 2,
      name: 'Pad Thai',
      cuisine: 'Thai',
      before: '/images/showcase/pad_thai_before.jpg',
      after: '/images/showcase/pad_thai_after.png',
      description: 'Simple product shot → Appetizing shrimp presentation',
      isReal: true // Real before/after - no CSS filters
    },
    {
      id: 3,
      name: 'Kimchi Tofu Soup',
      cuisine: 'Korean',
      before: '/images/showcase/kimchi_before.webp',
      after: '/images/showcase/kimchi_after.webp',
      description: 'Simple photo → Appetizing AI-enhanced presentation',
      isReal: true
    },
    {
      id: 4,
      name: 'Spaghetti Carbonara',
      cuisine: 'Italian',
      before: '/images/showcase/spaghetti_before.jpg',
      after: '/images/showcase/spaghetti_after.webp',
      description: 'Basic shot → Professional restaurant quality',
      isReal: true
    }
  ];

  // Auto-rotate examples
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveEnhancement((prev) => (prev + 1) % enhancementExamples.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [enhancementExamples.length]);

  const features = [
    {
      icon: <Wand2 className="w-8 h-8" />,
      title: "AI Photo Enhancement",
      description: "Transform ordinary food photos into stunning, magazine-quality images. Auto lighting, color correction, and presentation enhancement.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "AI Image Generation",
      description: "Don't have a photo? Describe your dish and our AI creates beautiful, realistic food images for your menu.",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: <Languages className="w-8 h-8" />,
      title: "Smart Translation",
      description: "Translate your menu to English automatically. Enterprise users unlock 13+ languages including Chinese, Japanese, Korean, and more.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <QrCode className="w-8 h-8" />,
      title: "Instant QR Menus",
      description: "Generate beautiful QR codes in seconds. Customers scan and view your digital menu instantly on their phones.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "POS System",
      description: "Complete order management with Kitchen Display System. Real-time order tracking and service request handling.",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Analytics Dashboard",
      description: "Track menu views, popular items, and customer behavior. Data-driven insights to optimize your menu.",
      gradient: "from-yellow-500 to-orange-500"
    }
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Image
                src="/images/app-logo.png"
                alt="SweetAsMenu"
                width={160}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-orange-500 transition-colors font-medium">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-orange-500 transition-colors font-medium">How It Works</a>
              <a href="#pricing" className="text-gray-600 hover:text-orange-500 transition-colors font-medium">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-orange-500 transition-colors font-medium">Reviews</a>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href="/login"
                className="text-gray-700 hover:text-orange-500 font-medium transition-colors px-4 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/login?tab=signup"
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:-translate-y-0.5"
              >
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Dramatic & Modern */}
      <section className="pt-32 pb-24 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-red-50"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-orange-200/30 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-red-200/30 to-transparent rounded-full blur-3xl"></div>

        {/* Floating Elements */}
        <div className="absolute top-40 left-10 w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl rotate-12 opacity-20 animate-pulse"></div>
        <div className="absolute top-60 right-20 w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg rotate-45 opacity-20 animate-pulse" style={{ animationDelay: '0.5s' }}></div>

        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center overflow-visible">
            <div className="max-w-2xl">
              {/* Badge */}
              <div className="inline-flex items-center bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-orange-200/50">
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered Restaurant Technology
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-[1.1]">
                Transform Your Menu with
                <span className="block bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
                  AI Magic
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Turn ordinary food photos into stunning visuals. Generate AI images, translate your menu,
                and get instant QR codes. <span className="font-semibold text-gray-800">Built for NZ restaurants.</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  href="/login?tab=signup"
                  className="group inline-flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all shadow-xl shadow-orange-200 hover:shadow-2xl hover:shadow-orange-300 hover:-translate-y-1"
                >
                  Start 14-Day Free Trial
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#ai-showcase"
                  className="group inline-flex items-center justify-center bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-2xl font-semibold text-lg transition-all border-2 border-gray-200 hover:border-orange-300"
                >
                  <Play className="w-5 h-5 mr-2 text-orange-500" />
                  See AI in Action
                </a>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  Cancel anytime
                </div>
              </div>
            </div>

            {/* Hero Visual - Interactive Enhancement Demo */}
            <div className="relative mt-4 mb-8 mr-4">
              <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 relative overflow-hidden">
                {/* Glow Effect */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-orange-400 to-red-500 rounded-full blur-3xl opacity-30"></div>

                <div className="relative">
                  {/* Demo Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <span className="text-xs text-gray-400 font-mono">SmartMenu AI Enhancement</span>
                  </div>

                  {/* Before/After Comparison */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="relative">
                      <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                        <Image
                          src={enhancementExamples[activeEnhancement].before}
                          alt="Before enhancement"
                          fill
                          className={`object-cover ${enhancementExamples[activeEnhancement].isReal ? '' : 'brightness-75 contrast-75 saturate-75'}`}
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                        {!enhancementExamples[activeEnhancement].isReal && (
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-gray-800/30 to-transparent"></div>
                        )}
                      </div>
                      <span className="absolute top-2 left-2 bg-gray-900/80 text-white text-xs px-2 py-1 rounded-lg font-semibold">
                        BEFORE
                      </span>
                    </div>
                    <div className="relative">
                      <div className="aspect-square rounded-xl overflow-hidden ring-2 ring-orange-500 ring-offset-2">
                        <Image
                          src={enhancementExamples[activeEnhancement].after}
                          alt="After AI enhancement"
                          fill
                          className={`object-cover ${enhancementExamples[activeEnhancement].isReal ? '' : 'brightness-110 contrast-110 saturate-110'}`}
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-200/10 via-transparent to-yellow-100/10"></div>
                      </div>
                      <span className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-lg font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI ENHANCED
                      </span>
                    </div>
                  </div>

                  {/* Example Info */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <div>
                      <p className="font-semibold text-gray-900">{enhancementExamples[activeEnhancement].name}</p>
                      <p className="text-xs text-gray-500">{enhancementExamples[activeEnhancement].description}</p>
                    </div>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold">
                      {enhancementExamples[activeEnhancement].cuisine}
                    </span>
                  </div>

                  {/* Navigation Dots */}
                  <div className="flex justify-center gap-2 mt-4">
                    {enhancementExamples.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveEnhancement(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === activeEnhancement
                            ? 'bg-orange-500 w-6'
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Stats */}
              <div className="absolute -bottom-6 left-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">+340%</p>
                    <p className="text-xs text-gray-500">Menu engagement</p>
                  </div>
                </div>
              </div>

              <div className="absolute top-2 -right-6 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl shadow-xl px-4 py-3 font-semibold flex items-center gap-2 z-10">
                <Wand2 className="w-5 h-5" />
                AI Magic!
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-8 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-10"></div>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "500+", label: "Restaurants", icon: "🍽️" },
              { number: "25,000+", label: "Photos Enhanced", icon: "✨" },
              { number: "13+", label: "Languages", icon: "🌍" },
              { number: "4.9★", label: "Rating", icon: "⭐" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1 flex items-center justify-center gap-2">
                  <span>{stat.icon}</span>
                  <span>{stat.number}</span>
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Showcase Section */}
      <section id="ai-showcase" className="py-24 bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-purple-500/20 text-purple-300 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-purple-500/30">
              <Wand2 className="w-4 h-4 mr-2" />
              AI Photo Enhancement
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Before & After
              <span className="block bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                AI Transformation
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              See how our AI transforms ordinary food photos into stunning, appetizing images that make customers hungry
            </p>
          </div>

          {/* Before/After Gallery */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {enhancementExamples.map((example, index) => (
              <div
                key={example.id}
                className="group relative bg-gray-800/50 backdrop-blur rounded-2xl p-4 border border-gray-700/50 hover:border-purple-500/50 transition-all cursor-pointer"
                onClick={() => setShowComparison(index)}
              >
                {/* Before/After Split View */}
                <div className="relative aspect-square rounded-xl overflow-hidden mb-4">
                  <div className="absolute inset-0 flex">
                    <div className="w-1/2 h-full relative overflow-hidden">
                      <Image
                        src={example.before}
                        alt={`${example.name} before`}
                        fill
                        className={`object-cover ${example.isReal ? '' : 'brightness-75 contrast-75 saturate-75'}`}
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-900/50"></div>
                    </div>
                    <div className="w-1/2 h-full relative overflow-hidden">
                      <Image
                        src={example.after}
                        alt={`${example.name} after`}
                        fill
                        className={`object-cover ${example.isReal ? '' : 'brightness-110 contrast-110 saturate-110'}`}
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-l from-transparent to-gray-900/50"></div>
                    </div>
                  </div>

                  {/* Center Divider */}
                  <div className="absolute inset-y-0 left-1/2 w-1 bg-gradient-to-b from-purple-500 via-pink-500 to-orange-500 transform -translate-x-1/2 shadow-lg shadow-purple-500/50"></div>

                  {/* Labels */}
                  <div className="absolute top-2 left-2 bg-gray-900/80 text-white text-[10px] px-2 py-1 rounded">BEFORE</div>
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-orange-500 text-white text-[10px] px-2 py-1 rounded flex items-center gap-1">
                    <Sparkles className="w-2 h-2" />
                    AFTER
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <span className="text-white text-sm font-semibold flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      Click to compare
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="font-semibold text-white mb-1">{example.name}</h3>
                  <p className="text-xs text-gray-400">{example.cuisine} Cuisine</p>
                </div>
              </div>
            ))}
          </div>

          {/* Enhancement Features */}
          <div className="mt-16 grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: "🌟", title: "Auto Lighting", desc: "Perfect exposure" },
              { icon: "🎨", title: "Color Balance", desc: "Vibrant colors" },
              { icon: "✨", title: "Sharpening", desc: "Crystal clarity" },
              { icon: "📸", title: "Pro Finish", desc: "Magazine quality" }
            ].map((feature, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl mb-2">{feature.icon}</div>
                <h4 className="font-semibold text-white">{feature.title}</h4>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Modal */}
      {showComparison !== null && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowComparison(null)}>
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowComparison(null)}
              className="absolute -top-12 right-0 text-white hover:text-orange-500 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden">
                <Image
                  src={enhancementExamples[showComparison].before}
                  alt="Before"
                  fill
                  className={`object-cover ${enhancementExamples[showComparison].isReal ? '' : 'brightness-75 contrast-75 saturate-75'}`}
                />
                {!enhancementExamples[showComparison].isReal && (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 to-transparent"></div>
                )}
                <span className="absolute top-4 left-4 bg-gray-900/80 text-white px-4 py-2 rounded-lg font-semibold">
                  BEFORE
                </span>
              </div>
              <div className="relative aspect-square rounded-2xl overflow-hidden ring-4 ring-orange-500">
                <Image
                  src={enhancementExamples[showComparison].after}
                  alt="After"
                  fill
                  className={`object-cover ${enhancementExamples[showComparison].isReal ? '' : 'brightness-110 contrast-110 saturate-110'}`}
                />
                <span className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI ENHANCED
                </span>
              </div>
            </div>
            <div className="text-center mt-6">
              <h3 className="text-2xl font-bold text-white mb-2">{enhancementExamples[showComparison].name}</h3>
              <p className="text-gray-400">{enhancementExamples[showComparison].description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              Powerful Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From AI photo enhancement to complete POS system - all in one platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white p-8 rounded-3xl border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gradient-to-br from-orange-50 via-white to-red-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Get Started in Minutes
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to transform your restaurant
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                title: "Upload Your Menu",
                description: "Upload photos of your dishes. No professional photography needed - we'll make them look amazing!",
                icon: <Upload className="w-8 h-8" />,
                color: "from-blue-500 to-cyan-500"
              },
              {
                step: "2",
                title: "AI Enhancement",
                description: "Our AI automatically enhances photos, generates descriptions, and translates your menu.",
                icon: <Sparkles className="w-8 h-8" />,
                color: "from-purple-500 to-pink-500"
              },
              {
                step: "3",
                title: "Go Live",
                description: "Get your QR code, share your digital menu link, and start receiving orders instantly!",
                icon: <QrCode className="w-8 h-8" />,
                color: "from-orange-500 to-red-500"
              }
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white p-8 rounded-3xl shadow-lg text-center h-full">
                  <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${step.color} text-white rounded-2xl text-3xl font-bold mb-6 shadow-lg`}>
                    {step.step}
                  </div>
                  <div className="mb-4 text-gray-400">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ChevronRight className="w-8 h-8 text-orange-300" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/login?tab=signup"
              className="inline-flex items-center bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all shadow-lg shadow-orange-200 hover:shadow-xl"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Loved by Restaurants
            </h2>
            <p className="text-xl text-gray-600">
              See what restaurant owners are saying
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Marco R.",
                location: "Auckland",
                cuisine: "🇮🇹 Italian",
                avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=96&h=96&fit=crop&crop=face",
                rating: 5,
                text: "The AI photo enhancement is incredible! Our pasta dishes look like they're from a magazine. Game changer for our business!"
              },
              {
                name: "Yuki T.",
                location: "Wellington",
                cuisine: "🇯🇵 Japanese",
                avatar: "/images/showcase/yuki_avatar.jpg",
                rating: 5,
                text: "Finally, a system that understands Asian cuisine! The translations are perfect and the QR menu is so convenient for tourists."
              },
              {
                name: "Raj P.",
                location: "Christchurch",
                cuisine: "🇮🇳 Indian",
                avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=96&h=96&fit=crop&crop=face",
                rating: 5,
                text: "The AI made our curry photos look absolutely delicious! Orders increased by 40% since we started using SmartMenu."
              }
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-4 bg-gray-100">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.location}</div>
                    <div className="text-xs text-orange-600 font-semibold mt-1">{testimonial.cuisine}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-gray-900">$39</span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Perfect for small takeaways</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "30 menu items",
                  "30 AI enhancements/month",
                  "Original + English",
                  "QR Menu & POS",
                  "Custom logo (small)"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                className="block text-center bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 rounded-xl font-semibold transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Professional - Popular */}
            <div className="bg-white p-8 rounded-3xl shadow-2xl border-2 border-orange-500 relative transform md:scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Professional</h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-gray-900">$89</span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">For casual dining restaurants</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited menu items",
                  "200 AI enhancements/month",
                  "Original + English",
                  "Full POS System",
                  "Custom logo & theme",
                  "Cover image"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                className="block text-center bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-xl font-semibold transition-colors shadow-lg"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-gray-900">$199</span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Fine dining & chains</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited everything",
                  "500 AI enhancements/month",
                  "13+ languages",
                  "White label (no branding)",
                  "Multi-branch support",
                  "Priority support"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/login?tab=signup"
                className="block text-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-xl font-semibold transition-colors shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Ready to Transform<br />Your Restaurant?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join hundreds of restaurants across New Zealand using SmartMenu AI.
            Start your free 14-day trial today.
          </p>
          <Link
            href="/login?tab=signup"
            className="inline-flex items-center bg-white hover:bg-gray-100 text-orange-600 px-8 py-4 rounded-2xl font-semibold text-lg transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
          >
            Start Free Trial
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <p className="text-white/70 text-sm mt-6">
            No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Image
                  src="/images/app-logo.png"
                  alt="SweetAsMenu"
                  width={140}
                  height={35}
                  className="h-9 w-auto brightness-0 invert"
                />
              </div>
              <p className="text-gray-400 mb-4">
                AI-powered digital menus for restaurants in New Zealand.
              </p>
              {/* Powered by Zestio Tech */}
              <a
                href="https://zestiotech.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <span className="text-sm">Powered by</span>
                <Image
                  src="/images/company-logo.png"
                  alt="Zestio Tech Ltd"
                  width={80}
                  height={20}
                  className="h-5 w-auto brightness-0 invert opacity-80 hover:opacity-100 transition-opacity"
                />
              </a>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-orange-500 transition-colors">Features</a></li>
                <li><Link href="/pricing" className="hover:text-orange-500 transition-colors">Pricing</Link></li>
                <li><a href="#how-it-works" className="hover:text-orange-500 transition-colors">How It Works</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="mailto:support@zestiotech.com" className="hover:text-orange-500 transition-colors">support@zestiotech.com</a></li>
                <li className="text-sm">25 Fraser Ave, Johnsonville</li>
                <li className="text-sm">Wellington 6037, New Zealand</li>
              </ul>
              {/* Social Links */}
              <div className="flex gap-4 mt-4">
                <a href="https://facebook.com/sweetasmenu" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-500 transition-colors" aria-label="Facebook">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://instagram.com/sweetasmenu" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-500 transition-colors" aria-label="Instagram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="https://linkedin.com/company/zestiotech" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-500 transition-colors" aria-label="LinkedIn">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-orange-500 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-orange-500 transition-colors">Terms of Service</Link></li>
                <li><Link href="/refunds" className="hover:text-orange-500 transition-colors">Refund Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} <a href="https://zestiotech.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">Zestio Tech Ltd</a>. All rights reserved.</p>
            <p className="text-sm mt-2">SweetAsMenu - Made with love in New Zealand</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
