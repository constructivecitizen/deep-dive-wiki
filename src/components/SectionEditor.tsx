import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Save } from 'lucide-react';

interface SectionEditData {
  content: string;
  title: string;
  level: number;
  position: number;
  parentPath: string;
}

interface SectionEditorProps {
  sectionData: SectionEditData | null;
  onSave: (updatedContent: string, title: string) => void;
  onClose: () => void;
}

export const SectionEditor: React.FC<SectionEditorProps> = ({
  sectionData,
  onSave,
  onClose
}) => {
  const [content, setContent] = useState(sectionData?.content || '');
  const [title, setTitle] = useState(sectionData?.title || '');

  const handleSave = () => {
    onSave(content, title);
    onClose();
  };

  if (!sectionData) return null;

  return (
    <Dialog open={!!sectionData} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Edit Section</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 space-y-4 overflow-hidden">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Section Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter section title..."
              className="w-full"
            />
          </div>
          
          <div className="flex-1 flex flex-col">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Content
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter section content..."
              className="flex-1 min-h-[300px] resize-none"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Section
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};