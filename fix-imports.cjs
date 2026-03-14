const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./client/src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('import * as React from "react"')) {
      const newContent = content.replace(
        /import \* as React from "react";?/g,
        'import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";'
      );
      fs.writeFileSync(filePath, newContent);
      console.log('Fixed', filePath);
    } else if (content.includes("import * as React from 'react'")) {
      const newContent = content.replace(
        /import \* as React from 'react';?/g,
        'import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";'
      );
      fs.writeFileSync(filePath, newContent);
      console.log('Fixed', filePath);
    }
  }
});
