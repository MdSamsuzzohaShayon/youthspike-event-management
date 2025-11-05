'use client'

import { useLdoId } from '@/lib/LdoProvider';
import Link from 'next/link';
import React from 'react';

function Page404NotFound() {
  const { ldoIdUrl } = useLdoId();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden flex items-center justify-center px-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl animate-pulse-slower"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black_30%,transparent_100%)]"></div>

      {/* Main Content Card */}
      <div className="relative z-10 max-w-2xl w-full">
        {/* Glow Effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400/20 via-red-500/10 to-yellow-400/20 rounded-3xl blur-xl opacity-50 animate-pulse-slow"></div>
        
        <div className="relative bg-gray-800/80 backdrop-blur-xl border border-yellow-400/20 rounded-2xl p-8 md:p-12 shadow-2xl overflow-hidden">
          {/* Decorative Top Bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse delay-75"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
            </div>
            <div className="text-xs text-yellow-400/60 font-mono tracking-wider">
              404_ERROR
            </div>
          </div>

          {/* 404 Number Display */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-yellow-400/10 to-red-500/20 blur-2xl rounded-full"></div>
              <h1 className="relative text-8xl md:text-9xl font-black bg-gradient-to-br from-red-500 via-yellow-400 to-red-600 bg-clip-text text-transparent animate-gradient-x">
                404
              </h1>
            </div>
          </div>

          {/* Main Message */}
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Lost in the Digital Space?
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed max-w-md mx-auto">
              The page you're looking for has drifted into the unknown. 
              Don't worry, even the best explorers sometimes take wrong turns.
            </p>
          </div>

          {/* Animated Search Indicator */}
          <div className="flex justify-center items-center mb-8">
            <div className="flex items-center space-x-4 bg-gray-900/50 border border-yellow-400/30 rounded-full px-6 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce delay-200"></div>
              </div>
              <span className="text-yellow-400 text-sm font-mono">PAGE_NOT_FOUND</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href={`/${ldoIdUrl}`}
              className="group relative bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold py-3 px-8 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-400/25 min-w-[200px] text-center"
            >
              <div className="absolute inset-0 bg-white/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
              <span className="relative">Return Home</span>
            </Link>
            
            <button 
              onClick={() => window.history.back()}
              className="group relative border-2 border-yellow-400/50 text-yellow-400 font-bold py-3 px-8 rounded-full transition-all duration-300 hover:scale-105 hover:bg-yellow-400/10 hover:border-yellow-400 min-w-[200px] text-center"
            >
              <span className="relative">Go Back</span>
            </button>
          </div>

          {/* Bottom Decoration */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-yellow-400/10">
            <div className="text-xs text-gray-400 font-mono">
              PRO_LEAGUE_2025
            </div>
            <div className="text-xs text-gray-400">
              Navigate safely
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400/20 rounded-full blur-sm animate-float"></div>
        <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-red-500/20 rounded-full blur-sm animate-float-delayed"></div>
      </div>

      {/* Background Particles */}
      <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-yellow-400/40 rounded-full animate-float"></div>
      <div className="absolute top-3/4 right-1/3 w-1.5 h-1.5 bg-red-500/30 rounded-full animate-float-slow"></div>
      <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-yellow-400/50 rounded-full animate-float-delayed"></div>
    </div>
  );
}

export default Page404NotFound;