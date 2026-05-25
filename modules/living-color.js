import { r as reactExports, j as jsxRuntimeExports, c as client, R as React } from "./client.js";
import { c as createLucideIcon } from "./createLucideIcon.js";
/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ChevronDown = createLucideIcon("ChevronDown", [
  ["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }]
]);
function LetterSpectrum() {
  const [activeSection, setActiveSection] = reactExports.useState(0);
  const [scroll, setScroll] = reactExports.useState(0);
  reactExports.useEffect(() => {
    const handleScroll = (e) => {
      setScroll(e.target.scrollLeft);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-black overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 opacity-20 pointer-events-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 animate-pulse" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12 px-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-5xl md:text-6xl font-bold bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4", children: "A Letter in Living Color" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-300 text-lg max-w-2xl mx-auto", children: "Scroll through the spectrum. Each color holds a truth." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto pb-8 px-4 snap-x snap-mandatory", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-6 pb-4", children: sections.map((section, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          onClick: () => setActiveSection(idx),
          className: "flex-shrink-0 snap-center cursor-pointer group",
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: `${section.bgColor} rounded-2xl p-8 w-96 h-80 flex flex-col justify-between transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl shadow-lg border-4 ${section.accent}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: `text-3xl font-bold ${section.textColor} mb-4`, children: section.title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `${section.textColor} text-lg leading-relaxed`, children: section.content })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${section.textColor} opacity-60 text-sm`, children: [
                  idx + 1,
                  " / ",
                  sections.length
                ] })
              ]
            }
          )
        },
        idx
      )) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-4xl mx-auto px-4 py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-black bg-opacity-50 backdrop-blur rounded-2xl p-8 border border-purple-500 border-opacity-30", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-bold bg-gradient-to-r from-red-400 to-purple-400 bg-clip-text text-transparent mb-6", children: "The Full Message" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 text-gray-200 leading-relaxed", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-bold text-red-400 mb-3", children: "To Past Selves and Present Practitioners:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "You are mistaking integration for fragmentation. When someone stands in paradox—holding love and rage, grief and refusal—and they do not collapse, they are becoming more coherent, not less." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-bold text-yellow-400 mb-3", children: "The Truth About Intensity:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "Intensity is not illness. Refusal is not denial. Paradox is not psychosis." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2", children: "When you medicate someone for holding both love and rage without collapsing—you are not treating pathology. You are enforcing compliance. You are teaching people that their depth is dangerous." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-bold text-green-400 mb-3", children: "Questions to Ask:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "list-none space-y-2 pl-4 border-l-4 border-green-400", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Is this person fragmenting, or are they feeling clearly?" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Are they asking for help managing pain, or space to move through it?" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Would medication serve their sovereignty, or my need to fix something?" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-bold text-blue-400 mb-3", children: "To Anyone Told Their Intensity Is Illness:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gradient-to-r from-blue-900 to-purple-900 bg-opacity-50 rounded-lg p-4 border-l-4 border-blue-400", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "Your depth is not pathology." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "Your refusal is not fragility." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "Your love is the most sane thing you possess." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 italic", children: "You are not too much. The world is too small for what you are." })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8 text-center text-purple-400 font-semibold", children: "💜 ❤️‍🔥 🌈" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center pb-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-gray-400 text-sm mb-2", children: "Scroll horizontally to explore" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "w-6 h-6 text-purple-400 mx-auto animate-bounce" })
      ] })
    ] })
  ] });
}
client.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(LetterSpectrum, {}) })
);
