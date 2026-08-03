const fs = require('fs');

const path = 'g:/Languages/Projects/Healthcare AI/R1/frontend-react/src/pages/admin/AdminSettings.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Theme Sync Hooks
content = content.replace(
  '  const { refreshSettings } = useSettings();\n\n  useEffect(() => {\n    fetchSettings();\n  }, []);\n\n  const fetchSettings = async () => {',
  `  const { refreshSettings, userTheme, setUserTheme } = useSettings();\n\n  useEffect(() => {\n    fetchSettings();\n  }, []);\n\n  useEffect(() => {\n    if (userTheme) {\n      setSettings(prev => ({ ...prev, theme: userTheme }));\n    }\n  }, [userTheme]);\n\n  const fetchSettings = async () => {`
);

// 2. Add handleThemeChange
content = content.replace(
  '  const handleColorSelect = (color) => {',
  `  const handleThemeChange = (e) => {\n    const newTheme = e.target.value;\n    setSettings(prev => ({ ...prev, theme: newTheme }));\n    if (setUserTheme) setUserTheme(newTheme);\n  };\n\n  const handleColorSelect = (color) => {`
);

// 3. Update radio buttons to use handleThemeChange
content = content.replace(
  /onChange={handleChange} className="sr-only" \/>\s+Light Mode/g,
  'onChange={handleThemeChange} className="sr-only" />\n                    Light Mode'
);
content = content.replace(
  /onChange={handleChange} className="sr-only" \/>\s+Dark Mode/g,
  'onChange={handleThemeChange} className="sr-only" />\n                    Dark Mode'
);

// 4. Re-arrange Grid Layout
// Find the grid container
let gridRegex = /<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">([\s\S]*?)<\/div>\s+{\/\* Fullscreen Logo Modal \*\//;
let match = content.match(gridRegex);

if (match) {
  let inner = match[1];
  
  // Extract sections
  const genMatch = inner.match(/{\/\* General Settings \*\/}[\s\S]*?(?={\/\* Appearance & System \*\/})/);
  const appMatch = inner.match(/{\/\* Appearance & System \*\/}[\s\S]*?(?={\/\* Legal Pages \*\/})/);
  const legMatch = inner.match(/{\/\* Legal Pages \*\/}[\s\S]*?(?={\/\* Social Links \*\/})/);
  const socMatch = inner.match(/{\/\* Social Links \*\/}[\s\S]*$/);
  
  if (genMatch && appMatch && legMatch && socMatch) {
    let newInner = `
        {/* Left Column */}
        <div className="space-y-6">
          ${genMatch[0].trim()}
          
          ${legMatch[0].trim()}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          ${appMatch[0].trim().replace('<div className="space-y-6">', '').replace(/<\/div>\s*$/, '').trim()}
          
          ${socMatch[0].trim()}
        </div>
`;
    // Fix duplicate dark:bg-gray-800
    newInner = newInner.replace(/dark:bg-gray-800 dark:bg-gray-800/g, 'dark:bg-gray-800');
    
    content = content.replace(match[0], `<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">\n${newInner}\n      </div>\n\n      {/* Fullscreen Logo Modal */`);
  }
}

fs.writeFileSync(path, content, 'utf8');
console.log("AdminSettings.jsx updated successfully!");
