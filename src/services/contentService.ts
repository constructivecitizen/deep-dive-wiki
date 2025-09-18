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

  static async saveDocumentContent(path: string, nodes: any[], originalMarkup?: string): Promise<boolean> {
    try {
      console.log('saveDocumentContent called with path:', path, 'originalMarkup provided:', !!originalMarkup);
      
      // First, try to get existing content
      const existingContent = await this.getContentByPath(path);
      console.log('Existing content found:', existingContent);
      
      if (!originalMarkup && nodes.length === 0) {
        console.log('No content to save, returning true');
        return true;
      }

      let fullContent = '';
      let title = 'Untitled';
      let allTags: string[] = [];
      
      if (originalMarkup) {
        // Use the original markup directly
        console.log('Using original markup:', originalMarkup.substring(0, 200) + '...');
        fullContent = originalMarkup.trim();
        
        // Extract title from the first line
        const firstLine = fullContent.split('\n')[0];
        const titleMatch = firstLine.match(/^#+\s*(.+?)(?:\s*\[.*?\])?$/);
        title = titleMatch ? titleMatch[1].trim() : firstLine.replace(/^#+\s*/, '').trim() || 'Untitled';
        
        // Extract tags from the first line if they exist (format: [tag1, tag2])
        const tagMatch = firstLine.match(/\[(.*?)\]/);
        if (tagMatch) {
          allTags = tagMatch[1].split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        }
        
        console.log('Extracted from markup:', { title, tags: allTags });
      } else {
        // Fallback to reconstructing from nodes
        const reconstructMarkdown = (nodeList: any[], currentDepth = 0): string => {
          let result = '';
          for (const node of nodeList) {
            if (node.content) {
              const headingLevel = '#'.repeat(Math.max(1, currentDepth + 1));
              const content = node.content.trim();
              
              if (!content.startsWith('#')) {
                result += `${headingLevel} ${content}\n\n`;
              } else {
                result += `${content}\n\n`;
              }
              
              if (node.tags && node.tags.length > 0) {
                allTags.push(...node.tags);
              }
            }
            
            if (node.children && node.children.length > 0) {
              result += reconstructMarkdown(node.children, currentDepth + 1);
            }
          }
          return result;
        };

        fullContent = reconstructMarkdown(nodes).trim();
        const firstLine = fullContent.split('\n')[0];
        title = firstLine.replace(/^#+\s*/, '').replace(/\[.*?\]/g, '').trim() || 'Untitled';
        allTags = [...new Set(allTags)];
      }

      if (existingContent) {
        console.log('Updating existing content with id:', existingContent.id);
        const success = await this.updateContentNode(existingContent.id, {
          title,
          content: fullContent,
          tags: allTags.length > 0 ? allTags : null
        });
        
        console.log('Update success:', success);
        return success;
      } else {
        console.log('Creating new content');
        const newContent = await this.createContentNode(title, fullContent, path, null, allTags.length > 0 ? allTags : []);
        console.log('New content created:', newContent);
        return newContent !== null;
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
    newSectionContent: string
  ): Promise<boolean> {
    try {
      console.log('updateSectionInDocument called with:', { path, sectionId, contentLength: newSectionContent.length });
      
      // Get the existing document
      const existingContent = await this.getContentByPath(path);
      if (!existingContent || !existingContent.content) {
        console.error('Document not found for section update');
        return false;
      }

      const updatedContent = this.replaceSectionInMarkup(existingContent.content, sectionId, newSectionContent);
      if (!updatedContent) {
        console.error('Failed to replace section in document');
        return false;
      }

      // Update the document with the new content
      const success = await this.updateContentNode(existingContent.id, {
        content: updatedContent
      });
      
      console.log('Section update success:', success);
      return success;
    } catch (error) {
      console.error('Error updating section in document:', error);
      return false;
    }
  }

  // Helper method to replace section content within markup
  static replaceSectionInMarkup(
    originalContent: string, 
    targetSectionId: string, 
    newSectionContent: string
  ): string | null {
    try {
      const lines = originalContent.split('\n');
      let sectionCount = 0;
      let sectionStartIndex = -1;
      let sectionEndIndex = -1;
      let sectionDepth = 0;
      let found = false;

      // Find the section boundaries
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const headingMatch = line.match(/^(#{1,30})\s*(.+?)(?:\s*\[(.*?)\])?$/);
        
        if (headingMatch) {
          const level = headingMatch[1].length;
          sectionCount++;
          const currentSectionId = `section-${sectionCount}`;
          
          if (currentSectionId === targetSectionId) {
            found = true;
            sectionStartIndex = i;
            sectionDepth = level;
          } else if (found && level <= sectionDepth) {
            // We've hit a section at the same or higher level - end of our section
            sectionEndIndex = i;
            break;
          }
        }
      }

      if (!found) {
        console.error('Section not found:', targetSectionId);
        return null;
      }

      // If we didn't find an end, the section goes to the end of the document
      if (sectionEndIndex === -1) {
        sectionEndIndex = lines.length;
      }

      // Replace the section content
      const beforeSection = lines.slice(0, sectionStartIndex);
      const afterSection = lines.slice(sectionEndIndex);
      const newSectionLines = newSectionContent.trim().split('\n');

      const updatedLines = [...beforeSection, ...newSectionLines, ...afterSection];
      return updatedLines.join('\n');
    } catch (error) {
      console.error('Error replacing section in markup:', error);
      return null;
    }
  }
}