import { supabase } from "@/integrations/supabase/client";

export interface DocumentSection {
  id: string;
  title: string;
  level: number;
  content: string;
  tags: string[];
}

export interface ContentItem {
  id: string;
  title: string;
  path: string;
  parent_id: string | null;
  order_index: number;
  content_json: DocumentSection[] | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  children?: ContentItem[];
}

// Type aliases for semantic clarity - these represent the same data as ContentItem
// but provide clearer intent in different contexts
export interface WikiDocument extends ContentItem {
  content_json: DocumentSection[];
}

export interface NavigationNode extends ContentItem {}

export class ContentService {
  // Helper method to normalize content_json from database
  private static normalizeContentJson(contentJson: any): DocumentSection[] | null {
    if (!contentJson) return null;
    
    if (Array.isArray(contentJson)) {
      return contentJson;
    }
    
    if (contentJson && typeof contentJson === 'object' && 'sections' in contentJson) {
      return contentJson.sections || [];
    }
    
    return null;
  }

  static async getNavigationStructure(): Promise<ContentItem[]> {
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .order('order_index');

    if (error) {
      console.error('Error fetching navigation structure:', error);
      return [];
    }

    // Cast the data to ensure correct typing and normalize content_json
    const typedData = (data || []).map(item => ({
      ...item,
      content_json: this.normalizeContentJson(item.content_json)
    }));

    return this.buildHierarchy(typedData);
  }

  static async getDocumentByPath(path: string): Promise<WikiDocument | null> {
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('path', path)
      .maybeSingle();

    if (error) {
      console.error('Error fetching document by path:', error);
      return null;
    }

    if (!data || !data.content_json) return null;

    const normalizedContent = this.normalizeContentJson(data.content_json);
    if (!normalizedContent) return null;

    return {
      ...data,
      content_json: normalizedContent
    };
  }

  static async getContentItemByPath(path: string): Promise<ContentItem | null> {
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('path', path)
      .maybeSingle();

    if (error) {
      console.error('Error fetching content item by path:', error);
      return null;
    }

    return data ? {
      ...data,
      content_json: this.normalizeContentJson(data.content_json)
    } : null;
  }

  static async getNavigationNodeByPath(path: string): Promise<NavigationNode | null> {
    return this.getContentItemByPath(path);
  }

  static async getNavigationNodeChildren(parentPath: string): Promise<ContentItem[]> {
    const parent = await this.getContentItemByPath(parentPath);
    if (!parent) return [];

    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('parent_id', parent.id)
      .order('order_index');

    if (error) {
      console.error('Error fetching navigation node children:', error);
      return [];
    }

    return (data || []).map(item => ({
      ...item,
      content_json: this.normalizeContentJson(item.content_json)
    }));
  }

  static async searchDocuments(query: string): Promise<WikiDocument[]> {
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .or(`title.ilike.%${query}%,content_json::text.ilike.%${query}%`)
      .order('title');

    if (error) {
      console.error('Error searching documents:', error);
      return [];
    }

    return (data || [])
      .map(doc => ({
        ...doc,
        content_json: this.normalizeContentJson(doc.content_json)
      }))
      .filter(doc => doc.content_json);
  }

  static async getAllDocuments(): Promise<WikiDocument[]> {
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .order('path');

    if (error) {
      console.error('Error fetching all documents:', error);
      return [];
    }

    return (data || [])
      .map(doc => ({
        ...doc,
        content_json: this.normalizeContentJson(doc.content_json)
      }))
      .filter(doc => doc.content_json);
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

  // Content management methods
  static async createFolder(title: string, parentId: string | null = null): Promise<ContentItem | null> {
    const parentPath = parentId ? (await this.getContentItemByPath(''))?.path || '' : '';
    const path = parentPath ? `${parentPath}/${title.toLowerCase().replace(/\s+/g, '-')}` : `/${title.toLowerCase().replace(/\s+/g, '-')}`;
    
    const { data, error } = await supabase
      .from('content_items')
      .insert({
        title,
        path,
        parent_id: parentId,
        order_index: 999,
        tags: []
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating folder:', error);
      return null;
    }

    return data ? {
      ...data,
      content_json: null
    } : null;
  }

  static async createDocument(
    title: string, 
    content_json: DocumentSection[], 
    path: string, 
    tags: string[] = []
  ): Promise<WikiDocument | null> {
    const { data, error } = await supabase
      .from('content_items')
      .insert({
        title,
        content_json: content_json as any,
        path,
        tags: tags.length > 0 ? tags : [],
        order_index: 999
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

  static async updateContentItem(
    id: string, 
    updates: Partial<Omit<ContentItem, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> {
    const dbUpdates = {
      ...updates,
      content_json: updates.content_json ? updates.content_json as any : undefined
    };

    const { error } = await supabase
      .from('content_items')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating content item:', error);
      return false;
    }

    return true;
  }

  static async updateDocument(
    id: string, 
    updates: Partial<Omit<WikiDocument, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> {
    return this.updateContentItem(id, updates);
  }

  static async deleteContentItem(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('content_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting content item:', error);
      return false;
    }

    return true;
  }

  static async saveDocumentContent(path: string, sections: DocumentSection[]): Promise<boolean> {
    try {
      console.log('saveDocumentContent called with path:', path, 'sections:', sections);
      
      // First, try to get existing content item
      const existingItem = await this.getContentItemByPath(path);
      console.log('Existing item found:', existingItem);
      
      if (sections.length === 0) {
        console.log('No sections to save, returning true');
        return true;
      }

      // Extract title and tags from sections
      const title = sections[0]?.title || 'Untitled';
      const allTags = [...new Set(sections.flatMap(s => s.tags || []))];
      
      if (existingItem) {
        console.log('Updating existing item with id:', existingItem.id);
        const success = await this.updateContentItem(existingItem.id, {
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

  static async updateSectionInDocument(
    path: string, 
    sectionId: string, 
    updatedSection: DocumentSection
  ): Promise<boolean> {
    try {
      console.log('updateSectionInDocument called with:', { path, sectionId, updatedSection });
      
      // Get the existing document
      const existingItem = await this.getContentItemByPath(path);
      if (!existingItem || !existingItem.content_json) {
        console.error('Document not found for section update');
        return false;
      }

      // Update the specific section in the JSON content  
      const sections = existingItem.content_json || [];
      const updatedSections = sections.map(section => 
        section.id === sectionId ? updatedSection : section
      );

      // Update the document with the new content
      const success = await this.updateContentItem(existingItem.id, {
        content_json: updatedSections
      });
      
      console.log('Section update success:', success);
      return success;
    } catch (error) {
      console.error('Error updating section in document:', error);
      return false;
    }
  }

  // Navigation management methods (backwards compatibility)
  static async createNavigationFolder(title: string, parentId: string | null = null): Promise<NavigationNode | null> {
    return this.createFolder(title, parentId);
  }

  static async updateNavigationNode(id: string, updates: Partial<NavigationNode>): Promise<boolean> {
    return this.updateContentItem(id, updates);
  }

  static async deleteNavigationNode(id: string): Promise<boolean> {
    return this.deleteContentItem(id);
  }

  static async reorderNavigationNodes(nodeId: string, newParentId: string | null, newOrderIndex: number): Promise<boolean> {
    const { error } = await supabase
      .from('content_items')
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
}