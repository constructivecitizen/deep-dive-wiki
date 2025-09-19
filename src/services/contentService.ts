import { supabase } from "@/integrations/supabase/client";

export interface DocumentSection {
  id: string;
  title: string;
  level: number;
  content: string;
  tags: string[];
}

export interface WikiDocument {
  id: string;
  title: string;
  path: string;
  content_json: any; // Will be cast to DocumentSection[] when used
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface NavigationNode {
  id: string;
  title: string;
  type: 'document' | 'folder';
  path: string;
  parent_id: string | null;
  order_index: number;
  document_id: string | null;
  created_at: string;
  updated_at: string;
  children?: NavigationNode[];
}

export class ContentService {
  static async getNavigationStructure(): Promise<NavigationNode[]> {
    const { data, error } = await supabase
      .from('navigation_structure')
      .select('*')
      .order('order_index');

    if (error) {
      console.error('Error fetching navigation structure:', error);
      return [];
    }

    // Cast the data to ensure correct typing
    const typedData = (data || []).map(item => ({
      ...item,
      type: item.type as 'document' | 'folder'
    }));

    return this.buildHierarchy(typedData);
  }

  static async getDocumentByPath(path: string): Promise<WikiDocument | null> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('path', path)
      .maybeSingle();

    if (error) {
      console.error('Error fetching document by path:', error);
      return null;
    }

    if (!data) return null;

    // Cast content_json to proper type
    return {
      ...data,
      content_json: data.content_json as unknown as DocumentSection[]
    };
  }

  static async searchDocuments(query: string): Promise<WikiDocument[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .or(`title.ilike.%${query}%,content_json::text.ilike.%${query}%`)
      .order('title');

    if (error) {
      console.error('Error searching documents:', error);
      return [];
    }

    return (data || []).map(doc => ({
      ...doc,
      content_json: doc.content_json as unknown as DocumentSection[]
    }));
  }

  static buildHierarchy<T extends { id: string; parent_id: string | null }>(
    items: T[]
  ): (T & { children?: T[] })[] {
    const itemMap = new Map<string, T & { children: T[] }>();
    const roots: (T & { children: T[] })[] = [];

    // Create map with empty children arrays
    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    // Build hierarchy
    items.forEach(item => {
      const itemWithChildren = itemMap.get(item.id)!;
      
      if (item.parent_id === null) {
        roots.push(itemWithChildren);
      } else {
        const parent = itemMap.get(item.parent_id);
        if (parent) {
          parent.children.push(itemWithChildren);
        }
      }
    });

    return roots;
  }

  static async getAllDocuments(): Promise<WikiDocument[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('path');

    if (error) {
      console.error('Error fetching all documents:', error);
      return [];
    }

    return (data || []).map(doc => ({
      ...doc,
      content_json: doc.content_json as unknown as DocumentSection[]
    }));
  }

  static async getNavigationNodeByPath(path: string): Promise<NavigationNode | null> {
    const { data, error } = await supabase
      .from('navigation_structure')
      .select('*')
      .eq('path', path)
      .maybeSingle();

    if (error) {
      console.error('Error fetching navigation node by path:', error);
      return null;
    }

    if (!data) return null;

    return {
      ...data,
      type: data.type as 'document' | 'folder'
    };
  }

  static async getNavigationNodeChildren(parentPath: string): Promise<NavigationNode[]> {
    const { data, error } = await supabase
      .from('navigation_structure')
      .select('*')
      .like('path', `${parentPath}/%`)
      .not('path', 'eq', parentPath)
      .order('order_index');

    if (error) {
      console.error('Error fetching navigation node children:', error);
      return [];
    }

    return (data || []).map(item => ({
      ...item,
      type: item.type as 'document' | 'folder'
    }));
  }

  // Navigation management methods
  static async createNavigationFolder(title: string, parentId: string | null = null): Promise<NavigationNode | null> {
    const path = parentId ? `/${title.toLowerCase().replace(/\s+/g, '-')}` : `/${title.toLowerCase().replace(/\s+/g, '-')}`;
    
    const { data, error } = await supabase
      .from('navigation_structure')
      .insert({
        title,
        type: 'folder',
        path,
        parent_id: parentId,
        order_index: 999 // Add at the end
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating navigation folder:', error);
      return null;
    }

    return {
      ...data,
      type: 'folder' as const
    };
  }

  static async updateNavigationNode(id: string, updates: Partial<NavigationNode>): Promise<boolean> {
    const { error } = await supabase
      .from('navigation_structure')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating navigation node:', error);
      return false;
    }

    return true;
  }

  static async deleteNavigationNode(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('navigation_structure')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting navigation node:', error);
      return false;
    }

    return true;
  }

  static async reorderNavigationNodes(nodeId: string, newParentId: string | null, newOrderIndex: number): Promise<boolean> {
    const { error } = await supabase
      .from('navigation_structure')
      .update({
        parent_id: newParentId,
        order_index: newOrderIndex
      })
      .eq('id', nodeId);

    if (error) {
      console.error('Error reordering navigation node:', error);
      return false;
    }

    return true;
  }

  // Document management methods
  static async createDocument(
    title: string, 
    content_json: DocumentSection[], 
    path: string, 
    tags: string[] = []
  ): Promise<WikiDocument | null> {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        title,
        content_json: content_json as any,
        path,
        tags: tags.length > 0 ? tags : []
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating document:', error);
      return null;
    }

    return {
      ...data,
      content_json: data.content_json as unknown as DocumentSection[]
    };
  }

  static async updateDocument(
    id: string, 
    updates: Partial<Omit<WikiDocument, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> {
    // Cast content_json to any for Supabase
    const dbUpdates = {
      ...updates,
      content_json: updates.content_json ? updates.content_json as any : undefined
    };

    const { error } = await supabase
      .from('documents')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating document:', error);
      return false;
    }

    return true;
  }

  static async saveDocumentContent(path: string, sections: DocumentSection[]): Promise<boolean> {
    try {
      console.log('saveDocumentContent called with path:', path, 'sections:', sections);
      
      // First, try to get existing document
      const existingDocument = await this.getDocumentByPath(path);
      console.log('Existing document found:', existingDocument);
      
      if (sections.length === 0) {
        console.log('No sections to save, returning true');
        return true;
      }

      // Extract title and tags from sections
      const title = sections[0]?.title || 'Untitled';
      const allTags = [...new Set(sections.flatMap(s => s.tags || []))];
      
      if (existingDocument) {
        console.log('Updating existing document with id:', existingDocument.id);
        const success = await this.updateDocument(existingDocument.id, {
          title,
          content_json: sections,
          tags: allTags.length > 0 ? allTags : []
        });
        
        console.log('Update success:', success);
        return success;
      } else {
        console.log('Creating new document');
        const newDocument = await this.createDocument(title, sections, path, allTags);
        console.log('New document created:', newDocument);
        return newDocument !== null;
      }
    } catch (error) {
      console.error('Error saving document content:', error);
      return false;
    }
  }

  // Section-specific update method
  static async updateSectionInDocument(
    path: string, 
    sectionId: string, 
    updatedSection: DocumentSection
  ): Promise<boolean> {
    try {
      console.log('updateSectionInDocument called with:', { path, sectionId, updatedSection });
      
      // Get the existing document
      const existingDocument = await this.getDocumentByPath(path);
      if (!existingDocument) {
        console.error('Document not found for section update');
        return false;
      }

      // Update the specific section in the JSON content
      const updatedSections = (existingDocument.content_json as unknown as DocumentSection[]).map(section => 
        section.id === sectionId ? updatedSection : section
      );

      // Update the document with the new content
      const success = await this.updateDocument(existingDocument.id, {
        content_json: updatedSections
      });
      
      console.log('Section update success:', success);
      return success;
    } catch (error) {
      console.error('Error updating section in document:', error);
      return false;
    }
  }
}