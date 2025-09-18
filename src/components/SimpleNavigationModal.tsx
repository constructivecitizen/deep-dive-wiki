import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimpleNavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimpleNavigationModal = ({ isOpen, onClose }: SimpleNavigationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Navigation Manager</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <p className="text-muted-foreground">
            Navigation management is not yet implemented. This will allow you to:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Add new pages and folders</li>
            <li>Reorganize the navigation structure</li>
            <li>Edit page titles and paths</li>
            <li>Delete pages and folders</li>
          </ul>
        </div>
      </div>
    </div>
  );
};