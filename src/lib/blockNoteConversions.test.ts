/**
 * Unit tests for BlockNote conversion utilities
 * Run in browser console: import('/src/lib/blockNoteConversions.test.ts').then(m => m.runAllTests())
 */

import { 
  flatSectionsToBlocks, 
  blocksToFlatSections, 
  validateRoundTrip,
  generateSectionId,
  SimpleBlock
} from './blockNoteConversions';
import { DocumentSection } from '@/services/contentService';

// Test data
const simpleSections: DocumentSection[] = [
  { id: '1', title: 'Introduction', level: 1, content: 'Welcome to the guide.', tags: [] },
  { id: '2', title: 'Getting Started', level: 1, content: 'Here is how to begin.', tags: [] },
];

const nestedSections: DocumentSection[] = [
  { id: '1', title: 'Chapter 1', level: 1, content: 'First chapter overview.', tags: [] },
  { id: '2', title: 'Section 1.1', level: 2, content: 'Details of section 1.1', tags: [] },
  { id: '3', title: 'Section 1.2', level: 2, content: 'Details of section 1.2', tags: [] },
  { id: '4', title: 'Chapter 2', level: 1, content: 'Second chapter overview.', tags: [] },
  { id: '5', title: 'Section 2.1', level: 2, content: 'Details of section 2.1', tags: [] },
];

const deeplyNestedSections: DocumentSection[] = [
  { id: '1', title: 'Root', level: 1, content: '', tags: [] },
  { id: '2', title: 'Level 2', level: 2, content: '', tags: [] },
  { id: '3', title: 'Level 3', level: 3, content: '', tags: [] },
  { id: '4', title: 'Level 4', level: 4, content: '', tags: [] },
  { id: '5', title: 'Back to Level 2', level: 2, content: '', tags: [] },
];

const sectionsWithContent: DocumentSection[] = [
  { 
    id: '1', 
    title: 'Features', 
    level: 1, 
    content: 'This product has many features.\n\n- Feature one\n- Feature two', 
    tags: ['product'] 
  },
];

// Test functions
export function testFlatSectionsToBlocks(): { passed: boolean; message: string } {
  try {
    const blocks = flatSectionsToBlocks(simpleSections);
    
    if (blocks.length !== 2) {
      return { passed: false, message: `Expected 2 blocks, got ${blocks.length}` };
    }
    
    if (blocks[0].type !== 'heading') {
      return { passed: false, message: `Expected heading type, got ${blocks[0].type}` };
    }
    
    return { passed: true, message: 'flatSectionsToBlocks works correctly' };
  } catch (error) {
    return { passed: false, message: `Error: ${error}` };
  }
}

export function testNestedConversion(): { passed: boolean; message: string } {
  try {
    const blocks = flatSectionsToBlocks(nestedSections);
    
    if (blocks.length !== 2) {
      return { passed: false, message: `Expected 2 root blocks, got ${blocks.length}` };
    }
    
    const chapter1Headings = blocks[0].children.filter(c => c.type === 'heading');
    if (chapter1Headings.length !== 2) {
      return { passed: false, message: `Expected 2 heading children, got ${chapter1Headings.length}` };
    }
    
    return { passed: true, message: 'Nested conversion works correctly' };
  } catch (error) {
    return { passed: false, message: `Error: ${error}` };
  }
}

export function testBlocksToFlatSections(): { passed: boolean; message: string } {
  try {
    const blocks = flatSectionsToBlocks(simpleSections);
    const sections = blocksToFlatSections(blocks);
    
    if (sections.length !== 2) {
      return { passed: false, message: `Expected 2 sections, got ${sections.length}` };
    }
    
    if (sections[0].title !== 'Introduction') {
      return { passed: false, message: `Expected "Introduction", got "${sections[0].title}"` };
    }
    
    return { passed: true, message: 'blocksToFlatSections works correctly' };
  } catch (error) {
    return { passed: false, message: `Error: ${error}` };
  }
}

export function testRoundTripSimple(): { passed: boolean; message: string } {
  try {
    const result = validateRoundTrip(simpleSections);
    if (!result.isValid) {
      return { passed: false, message: `Failed: ${result.differences.join(', ')}` };
    }
    return { passed: true, message: 'Simple round trip works' };
  } catch (error) {
    return { passed: false, message: `Error: ${error}` };
  }
}

export function testRoundTripNested(): { passed: boolean; message: string } {
  try {
    const result = validateRoundTrip(nestedSections);
    if (!result.isValid) {
      return { passed: false, message: `Failed: ${result.differences.join(', ')}` };
    }
    return { passed: true, message: 'Nested round trip works' };
  } catch (error) {
    return { passed: false, message: `Error: ${error}` };
  }
}

export function testEmptyInput(): { passed: boolean; message: string } {
  try {
    const blocks = flatSectionsToBlocks([]);
    const sections = blocksToFlatSections([]);
    
    if (blocks.length !== 0 || sections.length !== 0) {
      return { passed: false, message: 'Empty input should return empty array' };
    }
    return { passed: true, message: 'Empty input handled correctly' };
  } catch (error) {
    return { passed: false, message: `Error: ${error}` };
  }
}

export function testGenerateSectionId(): { passed: boolean; message: string } {
  try {
    const id1 = generateSectionId();
    const id2 = generateSectionId();
    
    if (id1 === id2) {
      return { passed: false, message: 'IDs should be unique' };
    }
    return { passed: true, message: 'ID generation works' };
  } catch (error) {
    return { passed: false, message: `Error: ${error}` };
  }
}

// Run all tests
export function runAllTests(): { total: number; passed: number; failed: number } {
  const tests = [
    { name: 'flatSectionsToBlocks', fn: testFlatSectionsToBlocks },
    { name: 'nestedConversion', fn: testNestedConversion },
    { name: 'blocksToFlatSections', fn: testBlocksToFlatSections },
    { name: 'roundTripSimple', fn: testRoundTripSimple },
    { name: 'roundTripNested', fn: testRoundTripNested },
    { name: 'emptyInput', fn: testEmptyInput },
    { name: 'generateSectionId', fn: testGenerateSectionId },
  ];
  
  const results = tests.map(test => ({ name: test.name, ...test.fn() }));
  
  console.log('\n=== BlockNote Conversion Tests ===');
  results.forEach(r => console.log(`${r.passed ? '✓' : '✗'} ${r.name}: ${r.message}`));
  
  const passed = results.filter(r => r.passed).length;
  console.log(`\nTotal: ${results.length}, Passed: ${passed}, Failed: ${results.length - passed}`);
  
  return { total: results.length, passed, failed: results.length - passed };
}
