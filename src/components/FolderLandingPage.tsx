import React from 'react';
import { Link } from 'react-router-dom';
import { NavigationNode, WikiDocument } from '@/services/contentService';
import { FolderIcon, FileTextIcon, PlusIcon, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FolderLandingPageProps {
  folder: NavigationNode;
  children: NavigationNode[];
  documents: WikiDocument[];
  onCreateDocument: () => void;
  onToggleDocumentEditor?: () => void;
}

export const FolderLandingPage: React.FC<FolderLandingPageProps> = ({
  folder,
  children,
  documents,
  onCreateDocument,
  onToggleDocumentEditor
}) => {
  // Get documents that belong to this folder
  const folderDocuments = documents.filter(doc => 
    doc.path.startsWith(folder.path) && doc.path !== folder.path
  );

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="flex justify-center mb-4">
          <FolderIcon className="h-16 w-16 text-muted-foreground" />
        </div>
        <div className="flex items-center justify-between max-w-2xl mx-auto mb-2">
          <h1 className="text-3xl font-bold text-foreground">{folder.title}</h1>
          {onToggleDocumentEditor && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onToggleDocumentEditor}
              className="h-8 w-8 p-0"
            >
              <FileEdit className="w-4 h-4" />
            </Button>
          )}
        </div>
        <p className="text-muted-foreground">
          This is a folder containing {children.length + folderDocuments.length} items
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Child Folders */}
        {children.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <FolderIcon className="h-5 w-5" />
              Folders ({children.length})
            </h2>
            <div className="space-y-2">
              {children.map((child) => (
                <Link
                  key={child.id}
                  to={child.path}
                  className="block p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FolderIcon className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-medium text-foreground">{child.title}</h3>
                      <p className="text-sm text-muted-foreground">Folder</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Documents */}
        {folderDocuments.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <FileTextIcon className="h-5 w-5" />
              Documents ({folderDocuments.length})
            </h2>
            <div className="space-y-2">
              {folderDocuments.map((doc) => (
                <Link
                  key={doc.id}
                  to={doc.path}
                  className="block p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileTextIcon className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-medium text-foreground">{doc.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {doc.tags && doc.tags.length > 0 && (
                          <span>{doc.tags.join(', ')}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create New Content */}
      <div className="text-center py-8 border-t border-border">
        <Button onClick={onCreateDocument} className="gap-2">
          <PlusIcon className="h-4 w-4" />
          Create New Document in {folder.title}
        </Button>
      </div>

      {/* Empty State */}
      {children.length === 0 && folderDocuments.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-4">This folder is empty</p>
          <p className="text-sm">Create your first document to get started</p>
        </div>
      )}
    </div>
  );
};