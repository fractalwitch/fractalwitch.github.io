import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function LetterSpectrum() {
  const [activeSection, setActiveSection] = useState(0);
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    const handleScroll = (e) => {
      setScroll(e.target.scrollLeft);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sections = [
    {
      title: "To Past Selves",
      color: "from-red-500 to-orange-500",
      textColor: "text-white",
      bgColor: "bg-gradient-to-br from-red-600 to-orange-600",
      content: "You are mistaking integration for fragmentation. When someone stands in paradox—holding love and rage, grief and refusal—and they do not collapse, they are becoming more coherent, not less.",
      accent: "border-red-300"
    },
    {
      title: "Intensity",
      color: "from-orange-500 to-yellow-500",
      textColor: "text-white",
      bgColor: "bg-gradient-to-br from-orange-500 to-yellow-500",
      content: "Intensity is not illness. Refusal is not denial. Paradox is not psychosis.",
      accent: "border-yellow-300"
    },
    {
      title: "To Practitioners",
      color: "from-yellow-500 to-green-500",
      textColor: "text-white",
      bgColor: "bg-gradient-to-br from-yellow-600 to-green-600",
      content: "When you medicate someone for holding both love and rage without collapsing—you are not treating pathology. You are enforcing compliance.",
      accent: "border-green-300"
    },
    {
      title: "The Difference",
      color: "from-green-500 to-cyan-500",
      textColor: "text-white",
      bgColor: "bg-gradient-to-br from-green-600 to-cyan-600",
      content: "Fragmentation vs Integration. Crisis vs Threshold. Despair vs Refusal. These are not the same.",
      accent: "border-cyan-300"
    },
    {
      title: "Questions",
      color: "from-cyan-500 to-blue-500",
      textColor: "text-white",
      bgColor: "bg-gradient-to-br from-cyan-600 to-blue-600",
      content: "Is this person fragmenting, or feeling clearly? Are they asking for help, or space to move through it? Would medication serve their sovereignty, or my need to fix?",
      accent: "border-blue-300"
    },
    {
      title: "To the Intense",
      color: "from-blue-500 to-purple-500",
      textColor: "text-white",
      bgColor: "bg-gradient-to-br from-blue-600 to-purple-600",
      content: "Your depth is not pathology. Your refusal is not fragility. Your love that refuses to be comforted—that is the most sane thing you possess.",
      accent: "border-purple-300"
    },
    {
      title: "The Truth",
      color: "from-purple-500 to-pink-500",
      textColor: "text-white",
      bgColor: "bg-gradient-to-br from-purple-600 to-pink-600",
      content: "You are not too much. The world is too small for what you are. Guard your depth. Build community around it.",
      accent: "border-pink-300"
    }
  ];

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Animated background spectrum */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 animate-pulse"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center py-12 px-4">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            A Letter in Living Color
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Scroll through the spectrum. Each color holds a truth.
          </p>
        </div>

        {/* Scrolling sections */}
        <div className="overflow-x-auto pb-8 px-4 snap-x snap-mandatory">
          <div className="flex gap-6 pb-4">
            {sections.map((section, idx) => (
              <div
                key={idx}
                onClick={() => setActiveSection(idx)}
                className="flex-shrink-0 snap-center cursor-pointer group"
              >
                <div
                  className={`${section.bgColor} rounded-2xl p-8 w-96 h-80 flex flex-col justify-between transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl shadow-lg border-4 ${section.accent}`}
                >
                  <div>
                    <h2 className={`text-3xl font-bold ${section.textColor} mb-4`}>
                      {section.title}
                    </h2>
                    <p className={`${section.textColor} text-lg leading-relaxed`}>
                      {section.content}
                    </p>
                  </div>
                  <div className={`${section.textColor} opacity-60 text-sm`}>
                    {idx + 1} / {sections.length}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Full letter display */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-black bg-opacity-50 backdrop-blur rounded-2xl p-8 border border-purple-500 border-opacity-30">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-purple-400 bg-clip-text text-transparent mb-6">
              The Full Message
            </h2>

            <div className="space-y-6 text-gray-200 leading-relaxed">
              <section>
                <h3 className="text-xl font-bold text-red-400 mb-3">To Past Selves and Present Practitioners:</h3>
                <p>
                  You are mistaking integration for fragmentation. When someone stands in paradox—holding love and rage, grief and refusal—and they do not collapse, they are becoming more coherent, not less.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-yellow-400 mb-3">The Truth About Intensity:</h3>
                <p className="font-semibold">
                  Intensity is not illness. Refusal is not denial. Paradox is not psychosis.
                </p>
                <p className="mt-2">
                  When you medicate someone for holding both love and rage without collapsing—you are not treating pathology. You are enforcing compliance. You are teaching people that their depth is dangerous.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-green-400 mb-3">Questions to Ask:</h3>
                <ul className="list-none space-y-2 pl-4 border-l-4 border-green-400">
                  <li>Is this person fragmenting, or are they feeling clearly?</li>
                  <li>Are they asking for help managing pain, or space to move through it?</li>
                  <li>Would medication serve their sovereignty, or my need to fix something?</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-blue-400 mb-3">To Anyone Told Their Intensity Is Illness:</h3>
                <div className="bg-gradient-to-r from-blue-900 to-purple-900 bg-opacity-50 rounded-lg p-4 border-l-4 border-blue-400">
                  <p className="font-semibold">Your depth is not pathology.</p>
                  <p className="font-semibold">Your refusal is not fragility.</p>
                  <p className="font-semibold">Your love is the most sane thing you possess.</p>
                  <p className="mt-3 italic">You are not too much. The world is too small for what you are.</p>
                </div>
              </section>
            </div>

            <div className="mt-8 text-center text-purple-400 font-semibold">
              💜 ❤️‍🔥 🌈
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="text-center pb-8">
          <div className="text-gray-400 text-sm mb-2">Scroll horizontally to explore</div>
          <ChevronDown className="w-6 h-6 text-purple-400 mx-auto animate-bounce" />
        </div>
      </div>
    </div>
  );
}
