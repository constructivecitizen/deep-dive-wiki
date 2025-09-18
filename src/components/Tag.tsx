import { Badge } from "@/components/ui/badge";

interface TagProps {
  text: string;
  variant?: "blue" | "green" | "purple" | "orange" | "red" | "teal";
  size?: "sm" | "md";
  onClick?: () => void;
  isActive?: boolean;
}

export const Tag = ({ 
  text, 
  variant = "blue", 
  size = "sm", 
  onClick, 
  isActive = false 
}: TagProps) => {
  const getTagClasses = () => {
    const baseClasses = "wiki-transition border cursor-pointer";
    const sizeClasses = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";
    const variantClasses = `tag-${variant}`;
    const activeClasses = isActive ? "ring-2 ring-primary/50" : "";
    
    return `${baseClasses} ${sizeClasses} ${variantClasses} ${activeClasses}`;
  };

  return (
    <Badge 
      variant="outline" 
      className={getTagClasses()}
      onClick={onClick}
    >
      {text}
    </Badge>
  );
};