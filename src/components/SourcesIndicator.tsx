import React from 'react';
import { Link2, ExternalLink } from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

interface SourcesIndicatorProps {
  sources: string[];
}

export const SourcesIndicator: React.FC<SourcesIndicatorProps> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;
  
  // Extract domain for display
  const getDomain = (url: string): string => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch {
      return url.slice(0, 30);
    }
  };
  
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button className="inline-flex items-center justify-center ml-2 px-1.5 py-0.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors flex-shrink-0">
          <Link2 className="w-3 h-3 mr-1" />
          {sources.length}
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-3" align="end">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Link2 className="w-4 h-4" />
            Sources ({sources.length})
          </h4>
          <ul className="space-y-1.5">
            {sources.map((url, index) => (
              <li key={index}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded bg-muted flex items-center justify-center text-[10px] font-medium">
                    {index + 1}
                  </span>
                  <span className="truncate flex-1">{getDomain(url)}</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
