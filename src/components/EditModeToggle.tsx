import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Eye, FileText } from "lucide-react";

interface EditModeToggleProps {
  onToggle: (editMode: boolean) => void;
  onDocumentEdit: () => void;
}

export const EditModeToggle = ({ onToggle, onDocumentEdit }: EditModeToggleProps) => {
  const [editMode, setEditMode] = useState(false);

  const toggleEditMode = () => {
    const newEditMode = !editMode;
    setEditMode(newEditMode);
    onToggle(newEditMode);
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      <Button
        onClick={onDocumentEdit}
        variant="outline"
        size="sm"
        className="shadow-lg"
      >
        <FileText className="h-4 w-4 mr-2" />
        Document Editor
      </Button>
      <Button
        onClick={toggleEditMode}
        variant={editMode ? "default" : "outline"}
        size="sm"
        className="shadow-lg"
      >
        {editMode ? (
          <>
            <Eye className="h-4 w-4 mr-2" />
            View Mode
          </>
        ) : (
          <>
            <Edit className="h-4 w-4 mr-2" />
            Node Editor
          </>
        )}
      </Button>
    </div>
  );
};