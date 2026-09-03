import React from 'react';

interface FooterProps {
  className?: string;
  variant?: 'full' | 'compact';
}

export const Footer: React.FC<FooterProps> = ({ className = '', variant = 'full' }) => {
  return (
    <footer
      className={`w-full shrink-0 ${
        variant === 'full'
          ? 'border-t border-[#1a1f2e] bg-[#090b10]/90 py-3.5 px-6'
          : 'pt-2 mt-2 border-t border-[#171b26]'
      } ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#8e98a8]">
        <p>
          Built by{' '}
          <a
            href="https://thesoftwareco.pages.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#c59b27] hover:text-[#deb43b] font-medium underline underline-offset-4 decoration-[#c59b27]/40 hover:decoration-[#c59b27] transition-colors"
          >
            THE SOFTWARE CO
          </a>{' '}
          &amp; <span className="text-[#f1f5f9] font-medium tracking-wide">SATYAM JAIN</span>
        </p>
        <p className="text-[11px] text-[#556075] font-mono">
          Lipi Engine &bull; Private On-Device Indic Document Processing
        </p>
      </div>
    </footer>
  );
};
