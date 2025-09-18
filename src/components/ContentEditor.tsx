import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Tag as TagIcon, X } from "lucide-react";
import { ContentNode } from "@/components/HierarchicalContent";

interface ContentEditorProps {
  node: ContentNode;
  onSave: (updatedNode: ContentNode) => void;
  onAddChild?: (parentId: string, newNode: ContentNode) => void;
  onDelete?: (nodeId: string) => void;
}

export const ContentEditor = ({ node, onSave, onAddChild, onDelete }: ContentEditorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<ContentNode>(node);
  const [newTag, setNewTag] = useState("");

  const handleSave = () => {
    onSave(editingNode);
    setIsOpen(false);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editingNode.tags?.includes(newTag.trim())) {
      setEditingNode({
        ...editingNode,
        tags: [...(editingNode.tags || []), newTag.trim()]
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditingNode({
      ...editingNode,
      tags: editingNode.tags?.filter(tag => tag !== tagToRemove)
    });
  };

  const handleAddChild = () => {
    const newChild: ContentNode = {
      id: `node-${Date.now()}`,
      content: "New content item",
      tags: [],
      depth: node.depth + 1
    };
    
    if (onAddChild) {
      onAddChild(node.id, newChild);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 wiki-transition ml-2"
        >
          <Edit className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Content Node</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={editingNode.content}
              onChange={(e) => setEditingNode({ ...editingNode, content: e.target.value })}
              placeholder="Enter your content here..."
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Tags (hidden from display)</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {editingNode.tags?.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  <TagIcon className="h-3 w-3" />
                  {tag}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add new tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <Button onClick={handleAddTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <div className="space-x-2">
              <Button onClick={handleAddChild} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Child
              </Button>
              {onDelete && (
                <Button
                  onClick={() => {
                    onDelete(node.id);
                    setIsOpen(false);
                  }}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            
            <div className="space-x-2">
              <Button onClick={() => setIsOpen(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};