import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ChevronUp, ChevronDown, Edit2, Plus, X, Settings } from 'lucide-react';
import { ContentNode } from '@/components/HierarchicalContent';
import { Tag } from '@/components/Tag';

interface NodeManagementProps {
  nodes: ContentNode[];
  onNodesChange: (nodes: ContentNode[]) => void;
}

interface NodeEditProps {
  node: ContentNode;
  onSave: (updatedNode: ContentNode) => void;
}

const NodeEditor = ({ node, onSave }: NodeEditProps) => {
  const [title, setTitle] = useState(node.content.split('\n')[0] || node.content);
  const [tags, setTags] = useState(node.tags || []);
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = () => {
    onSave({
      ...node,
      content: title,
      tags
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Node Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter node title..."
        />
      </div>
      
      <div>
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              {tag}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleRemoveTag(tag)}
              />
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add tag..."
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
          />
          <Button onClick={handleAddTag} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Button onClick={handleSave} className="w-full">
        Save Changes
      </Button>
    </div>
  );
};

export const NodeManagement = ({ nodes, onNodesChange }: NodeManagementProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const moveNode = (index: number, direction: 'up' | 'down') => {
    const newNodes = [...nodes];
    if (direction === 'up' && index > 0) {
      [newNodes[index], newNodes[index - 1]] = [newNodes[index - 1], newNodes[index]];
    } else if (direction === 'down' && index < newNodes.length - 1) {
      [newNodes[index], newNodes[index + 1]] = [newNodes[index + 1], newNodes[index]];
    }
    onNodesChange(newNodes);
  };

  const updateNode = (index: number, updatedNode: ContentNode) => {
    const newNodes = [...nodes];
    newNodes[index] = updatedNode;
    onNodesChange(newNodes);
  };

  const addNewNode = () => {
    const newNode: ContentNode = {
      id: `node-${Date.now()}`,
      content: 'New Section',
      tags: [],
      depth: 0,
      children: []
    };
    onNodesChange([...nodes, newNode]);
  };

  const removeNode = (index: number) => {
    const newNodes = nodes.filter((_, i) => i !== index);
    onNodesChange(newNodes);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Manage Sections
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Top-Level Sections</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Reorder, edit, and manage your main content sections
            </span>
            <Button onClick={addNewNode} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>
          
          {nodes.map((node, index) => (
            <Card key={node.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex flex-col gap-1">
                  <Button
                    onClick={() => moveNode(index, 'up')}
                    disabled={index === 0}
                    size="sm"
                    variant="outline"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => moveNode(index, 'down')}
                    disabled={index === nodes.length - 1}
                    size="sm"
                    variant="outline"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{node.content.split('\n')[0] || node.content}</h4>
                    <div className="flex flex-wrap gap-1">
                      {node.tags?.map((tag) => (
                        <Tag key={tag} text={tag} />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Section</DialogTitle>
                        </DialogHeader>
                        <NodeEditor
                          node={node}
                          onSave={(updatedNode) => updateNode(index, updatedNode)}
                        />
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      onClick={() => removeNode(index)}
                      size="sm" 
                      variant="destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};