import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // Split lines
  const lines = content.split('\n');

  const renderInline = (text: string) => {
    // Parse bold (**text** or __text__), italic (*text* or _text_), code (`text`), strikethrough (~~text~~)
    const elements: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    // Regex for bold, italic, inline code
    const regex = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`)/;

    while (remaining.length > 0) {
      const match = remaining.match(regex);
      if (!match || match.index === undefined) {
        elements.push(remaining);
        break;
      }

      if (match.index > 0) {
        elements.push(remaining.substring(0, match.index));
      }

      const matchText = match[0];
      if ((matchText.startsWith('**') && matchText.endsWith('**')) || (matchText.startsWith('__') && matchText.endsWith('__'))) {
        elements.push(
          <strong key={keyIdx++} className="font-extrabold text-slate-900 dark:text-white">
            {matchText.slice(2, -2)}
          </strong>
        );
      } else if ((matchText.startsWith('*') && matchText.endsWith('*')) || (matchText.startsWith('_') && matchText.endsWith('_'))) {
        elements.push(
          <em key={keyIdx++} className="italic text-slate-700 dark:text-slate-300 font-serif">
            {matchText.slice(1, -1)}
          </em>
        );
      } else if (matchText.startsWith('`') && matchText.endsWith('`')) {
        elements.push(
          <code key={keyIdx++} className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-xs font-mono text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
            {matchText.slice(1, -1)}
          </code>
        );
      }

      remaining = remaining.substring(match.index + matchText.length);
    }

    return elements;
  };

  return (
    <div className="space-y-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-2" />;
        }

        // Headings
        if (line.startsWith('# ')) {
          return (
            <h1 key={idx} className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white pt-2 pb-1 border-b border-slate-200 dark:border-slate-800">
              {renderInline(line.substring(2))}
            </h1>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white pt-2 pb-1">
              {renderInline(line.substring(3))}
            </h2>
          );
        }
        if (line.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-sm sm:text-base font-bold text-slate-900 dark:text-white pt-1">
              {renderInline(line.substring(4))}
            </h3>
          );
        }

        // Bullet point lists (- or * or •)
        if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-2 my-1">
              <span className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <div className="flex-1">{renderInline(line.substring(2))}</div>
            </div>
          );
        }

        // Numbered list (1. 2. etc)
        const numMatch = line.match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-2 my-1">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0 mt-0.5">
                {numMatch[1]}.
              </span>
              <div className="flex-1">{renderInline(numMatch[2])}</div>
            </div>
          );
        }

        // Blockquotes
        if (line.startsWith('> ')) {
          return (
            <div key={idx} className="border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 pl-3 py-1.5 my-1 text-slate-700 dark:text-slate-300 italic rounded-r-md">
              {renderInline(line.substring(2))}
            </div>
          );
        }

        // Regular paragraph with regular, bold, italic inline formatting
        return (
          <p key={idx} className="leading-relaxed">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
};
