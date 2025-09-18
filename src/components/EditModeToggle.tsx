import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Eye } from "lucide-react";

interface EditModeToggleProps {
  onToggle: (editMode: boolean) => void;
}

export const EditModeToggle = ({ onToggle }: EditModeToggleProps) => {
  const [editMode, setEditMode] = useState(false);

  const toggleEditMode = () => {
    const newEditMode = !editMode;
    setEditMode(newEditMode);
    onToggle(newEditMode);
  };

  return (
    <Button
      onClick={toggleEditMode}
      variant={editMode ? "default" : "outline"}
      size="sm"
      className="fixed top-4 right-4 z-50 shadow-lg"
    >
      {editMode ? (
        <>
          <Eye className="h-4 w-4 mr-2" />
          View Mode
        </>
      ) : (
        <>
          <Edit className="h-4 w-4 mr-2" />
          Edit Mode
        </>
      )}
    </Button>
  );
};