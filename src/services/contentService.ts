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
}