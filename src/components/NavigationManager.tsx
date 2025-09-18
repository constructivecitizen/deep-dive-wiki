import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronUp, ChevronDown, Edit2, Plus, X, FolderTree, FileText, Folder } from 'lucide-react';
import { DocumentStructure } from '@/components/DocumentSidebar';

interface NavigationManagerProps {
  structure: DocumentStructure[];
  onStructureChange: (structure: DocumentStructure[]) => void;
}

interface ItemEditorProps {
  item: DocumentStructure;
  onSave: (updatedItem: DocumentStructure) => void;
}

const ItemEditor = ({ item, onSave }: ItemEditorProps) => {
  const [title, setTitle] = useState(item.title);
  const [path, setPath] = useState(item.path || '');
  const [type, setType] = useState<'folder' | 'document'>(item.type);

  const handleSave = () => {
    onSave({
      ...item,
      title,
      path: path || undefined,
      type
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter navigation item title..."
        />
      </div>
      
      <div>
        <Label htmlFor="type">Type</Label>
        <Select value={type} onValueChange={(value: 'folder' | 'document') => setType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="folder">Folder</SelectItem>
            <SelectItem value="document">Document</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="path">Path (optional)</Label>
        <Input
          id="path"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="/example-path"
        />
      </div>
      
      <Button onClick={handleSave} className="w-full">
        Save Changes
      </Button>
    </div>
  );
};

export const NavigationManager = ({ structure, onStructureChange }: NavigationManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newStructure = [...structure];
    if (direction === 'up' && index > 0) {
      [newStructure[index], newStructure[index - 1]] = [newStructure[index - 1], newStructure[index]];
    } else if (direction === 'down' && index < newStructure.length - 1) {
      [newStructure[index], newStructure[index + 1]] = [newStructure[index + 1], newStructure[index]];
    }
    onStructureChange(newStructure);
  };

  const updateItem = (index: number, updatedItem: DocumentStructure) => {
    const newStructure = [...structure];
    newStructure[index] = updatedItem;
    onStructureChange(newStructure);
  };

  const addNewItem = () => {
    const newItem: DocumentStructure = {
      id: `nav-${Date.now()}`,
      title: 'New Topic',
      type: 'folder',
      path: `/new-topic-${Date.now()}`,
      children: []
    };
    onStructureChange([...structure, newItem]);
  };

  const removeItem = (index: number) => {
    const newStructure = structure.filter((_, i) => i !== index);
    onStructureChange(newStructure);
  };

  const getIcon = (type: 'folder' | 'document') => {
    return type === 'folder' ? Folder : FileText;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FolderTree className="h-4 w-4 mr-2" />
          Manage Navigation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Navigation Structure</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Manage your main navigation categories and topics
            </span>
            <Button onClick={addNewItem} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Topic
            </Button>
          </div>
          
          {structure.map((item, index) => {
            const Icon = getIcon(item.type);
            
            return (
              <Card key={item.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col gap-1">
                    <Button
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                      size="sm"
                      variant="outline"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === structure.length - 1}
                      size="sm"
                      variant="outline"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium">{item.title}</h4>
                      <Badge variant={item.type === 'folder' ? 'secondary' : 'outline'}>
                        {item.type}
                      </Badge>
                      {item.children && item.children.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {item.children.length} items
                        </Badge>
                      )}
                    </div>
                    
                    {item.path && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Path: {item.path}
                      </p>
                    )}
                    
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
                            <DialogTitle>Edit Navigation Item</DialogTitle>
                          </DialogHeader>
                          <ItemEditor
                            item={item}
                            onSave={(updatedItem) => updateItem(index, updatedItem)}
                          />
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        onClick={() => removeItem(index)}
                        size="sm" 
                        variant="destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};