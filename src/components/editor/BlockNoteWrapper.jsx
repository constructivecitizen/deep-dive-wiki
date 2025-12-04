const DEEP_LEVEL_STYLES = `
  /* Visual indentation for deep heading levels */
  .blocknote-wrapper [data-level="4"] { margin-left: 24px !important; }
  .blocknote-wrapper [data-level="5"] { margin-left: 48px !important; }
  .blocknote-wrapper [data-level="6"] { margin-left: 72px !important; }
  .blocknote-wrapper [data-level="7"] { margin-left: 96px !important; }
  .blocknote-wrapper [data-level="8"] { margin-left: 120px !important; }
  .blocknote-wrapper [data-level="9"] { margin-left: 144px !important; }
  .blocknote-wrapper [data-level="10"] { margin-left: 168px !important; }
  .blocknote-wrapper [data-level-deep] { margin-left: calc(168px + (var(--extra-levels) * 24px)) !important; }
  
  /* Visual indicators for deep levels (headings only) */
  .blocknote-wrapper [data-content-type="heading"][data-level]::before {
    content: attr(data-level-badge);
    display: inline-block;
    font-size: 9px;
    padding: 1px 4px;
    border-radius: 3px;
    margin-right: 6px;
    font-weight: 500;
    vertical-align: middle;
  }
  .blocknote-wrapper [data-content-type="heading"][data-level="4"]::before { background: #dbeafe; color: #1d4ed8; }
  .blocknote-wrapper [data-content-type="heading"][data-level="5"]::before { background: #dcfce7; color: #15803d; }
  .blocknote-wrapper [data-content-type="heading"][data-level="6"]::before { background: #f3e8ff; color: #7c3aed; }
  .blocknote-wrapper [data-content-type="heading"][data-level="7"]::before { background: #ffedd5; color: #c2410c; }
  .blocknote-wrapper [data-content-type="heading"][data-level="8"]::before { background: #fce7f3; color: #be185d; }
  .blocknote-wrapper [data-content-type="heading"][data-level="9"]::before { background: #ccfbf1; color: #0f766e; }
  .blocknote-wrapper [data-content-type="heading"][data-level-deep]::before { background: #e5e7eb; color: #374151; }
  
  /* Ensure headings have NO background color - target h1-h6 explicitly */
  .blocknote-wrapper h1, 
  .blocknote-wrapper h2, 
  .blocknote-wrapper h3, 
  .blocknote-wrapper h4, 
  .blocknote-wrapper h5, 
  .blocknote-wrapper h6 {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
  }
  
  /* Background colors for <p> elements ONLY - cycles through 6 colors for all 99 levels */
  .blocknote-wrapper p[data-content-level="1"],
  .blocknote-wrapper li[data-content-level="1"] {
    background-color: hsl(155, 40%, 96%) !important;
    border-left: 3px solid hsl(155, 40%, 75%) !important;
    padding: 8px 12px !important;
    margin: 4px 0 !important;
    border-radius: 4px !important;
  }
  
  .blocknote-wrapper p[data-content-level="2"],
  .blocknote-wrapper li[data-content-level="2"] {
    background-color: hsl(210, 50%, 96%) !important;
    border-left: 3px solid hsl(210, 50%, 75%) !important;
    padding: 8px 12px !important;
    margin: 4px 0 !important;
    border-radius: 4px !important;
  }
  
  .blocknote-wrapper p[data-content-level="3"],
  .blocknote-wrapper li[data-content-level="3"] {
    background-color: hsl(265, 45%, 96%) !important;
    border-left: 3px solid hsl(265, 45%, 75%) !important;
    padding: 8px 12px !important;
    margin: 4px 0 !important;
    border-radius: 4px !important;
  }
  
  .blocknote-wrapper p[data-content-level="4"],
  .blocknote-wrapper li[data-content-level="4"] {
    background-color: hsl(25, 55%, 96%) !important;
    border-left: 3px solid hsl(25, 55%, 75%) !important;
    padding: 8px 12px !important;
    margin: 4px 0 !important;
    border-radius: 4px !important;
  }
  
  .blocknote-wrapper p[data-content-level="5"],
  .blocknote-wrapper li[data-content-level="5"] {
    background-color: hsl(340, 40%, 96%) !important;
    border-left: 3px solid hsl(340, 40%, 75%) !important;
    padding: 8px 12px !important;
    margin: 4px 0 !important;
    border-radius: 4px !important;
  }
  
  .blocknote-wrapper p[data-content-level="6"],
  .blocknote-wrapper li[data-content-level="6"] {
    background-color: hsl(180, 45%, 96%) !important;
    border-left: 3px solid hsl(180, 45%, 75%) !important;
    padding: 8px 12px !important;
    margin: 4px 0 !important;
    border-radius: 4px !important;
  }
`;
