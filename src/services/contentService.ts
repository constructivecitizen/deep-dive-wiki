import { supabase } from "@/integrations/supabase/client";

export interface ContentNode {
  id: string;
  title: string;
  content: string | null;
  parent_id: string | null;
  path: string;
  depth: number;
  tags: string[] | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  children?: ContentNode[];
}

export interface NavigationNode {
  id: string;
  title: string;
  type: 'document' | 'folder';
  path: string;
  parent_id: string | null;
  order_index: number;
  content_node_id: string | null;
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

  static async getContentByPath(path: string): Promise<ContentNode | null> {
    const { data, error } = await supabase
      .from('content_nodes')
      .select('*')
      .eq('path', path)
      .maybeSingle();

    if (error) {
      console.error('Error fetching content by path:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    // Get children of this content node
    const children = await this.getContentChildren(data.id);

    return {
      ...data,
      children
    };
  }

  static async getContentChildren(parentId: string): Promise<ContentNode[]> {
    const { data, error } = await supabase
      .from('content_nodes')
      .select('*')
      .eq('parent_id', parentId)
      .order('order_index');

    if (error) {
      console.error('Error fetching content children:', error);
      return [];
    }

    const childrenWithGrandchildren = await Promise.all(
      (data || []).map(async (child) => {
        const grandchildren = await this.getContentChildren(child.id);
        return {
          ...child,
          children: grandchildren
        };
      })
    );

    return childrenWithGrandchildren;
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

  static async searchContent(query: string): Promise<ContentNode[]> {
    const { data, error } = await supabase
      .from('content_nodes')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('title');

    if (error) {
      console.error('Error searching content:', error);
      return [];
    }

    return data || [];
  }

  static async getAllContentNodes(): Promise<ContentNode[]> {
    const { data, error } = await supabase
      .from('content_nodes')
      .select('*')
      .order('path');

    if (error) {
      console.error('Error fetching all content nodes:', error);
      return [];
    }

    return this.buildHierarchy(data || []);
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

  // Content management methods
  static async createContentNode(
    title: string, 
    content: string, 
    path: string, 
    parentId: string | null = null,
    tags: string[] = []
  ): Promise<ContentNode | null> {
    // Calculate depth based on path segments
    const depth = path.split('/').filter(Boolean).length;
    
    const { data, error } = await supabase
      .from('content_nodes')
      .insert({
        title,
        content,
        path,
        parent_id: parentId,
        depth,
        tags: tags.length > 0 ? tags : null,
        order_index: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating content node:', error);
      return null;
    }

    return data;
  }

  static async updateContentNode(
    id: string, 
    updates: Partial<Omit<ContentNode, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> {
    const { error } = await supabase
      .from('content_nodes')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating content node:', error);
      return false;
    }

    return true;
  }

  static async saveDocumentContent(path: string, nodes: any[]): Promise<boolean> {
    try {
      console.log('saveDocumentContent called with path:', path, 'nodes:', nodes);
      
      // First, try to get existing content
      const existingContent = await this.getContentByPath(path);
      console.log('Existing content found:', existingContent);
      
      if (nodes.length === 0) {
        console.log('No nodes to save, returning true');
        return true; // Nothing to save
      }

      // Get the main node (first one should be the page content)
      const mainNode = nodes[0];
      const title = mainNode.content?.split('\n')[0]?.replace(/^#+\s*/, '') || 'Untitled';
      const content = mainNode.content || '';
      const tags = mainNode.tags || [];

      console.log('Processing node:', { title, content: content.substring(0, 100) + '...', tags });

      if (existingContent) {
        console.log('Updating existing content with id:', existingContent.id);
        // Update existing content
        const success = await this.updateContentNode(existingContent.id, {
          title,
          content,
          tags: tags.length > 0 ? tags : null
        });
        
        console.log('Update success:', success);
        
        // Handle child nodes (for now, we'll just update the main content)
        // In the future, you could implement full hierarchical content editing
        
        return success;
      } else {
        console.log('Creating new content');
        // Create new content
        const newContent = await this.createContentNode(title, content, path, null, tags);
        console.log('New content created:', newContent);
        return newContent !== null;
      }
    } catch (error) {
      console.error('Error saving document content:', error);
      return false;
    }
  }
}