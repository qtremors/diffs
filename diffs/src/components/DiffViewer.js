"use client";

import React, { useRef, useEffect, useState } from 'react';
import * as Diff from 'diff';

export default function DiffViewer({ oldText, newText }) {
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const [diffData, setDiffData] = useState([]);

  useEffect(() => {
    // 1. Get line-level diff
    const lineDiff = Diff.diffLines(oldText, newText);
    
    // 2. Process lineDiff to identify pairs and align them
    const processed = [];
    for (let i = 0; i < lineDiff.length; i++) {
      const part = lineDiff[i];
      const nextPart = lineDiff[i + 1];

      if (part.removed && nextPart && nextPart.added) {
        // Paired block for modification
        const oldLines = part.value.split('\n');
        if (oldLines[oldLines.length - 1] === '') oldLines.pop();
        
        const newLines = nextPart.value.split('\n');
        if (newLines[newLines.length - 1] === '') newLines.pop();

        // Find common lines or just pair them up
        const maxLen = Math.max(oldLines.length, newLines.length);
        for (let j = 0; j < maxLen; j++) {
          processed.push({
            type: 'modification',
            oldLine: oldLines[j] || null,
            newLine: newLines[j] || null
          });
        }
        i++; // skip added part
      } else {
        const lines = part.value.split('\n');
        if (lines[lines.length - 1] === '') lines.pop();
        
        lines.forEach(line => {
          processed.push({
            type: part.added ? 'added' : part.removed ? 'removed' : 'unchanged',
            line: line
          });
        });
      }
    }
    setDiffData(processed);
  }, [oldText, newText]);

  const handleScroll = (e) => {
    const { scrollTop, scrollLeft } = e.target;
    if (e.target === leftRef.current && rightRef.current) {
      rightRef.current.scrollTop = scrollTop;
      rightRef.current.scrollLeft = scrollLeft;
    } else if (e.target === rightRef.current && leftRef.current) {
      leftRef.current.scrollTop = scrollTop;
      leftRef.current.scrollLeft = scrollLeft;
    }
  };

  const renderCharDiff = (oldLine, newLine, side) => {
    if (oldLine === null || newLine === null) {
      return side === 'left' ? oldLine : newLine;
    }
    const charDiff = Diff.diffChars(oldLine, newLine);
    return charDiff.map((part, index) => {
      if (side === 'left' && part.added) return null;
      if (side === 'right' && part.removed) return null;
      
      const className = part.added ? 'char-added' : part.removed ? 'char-removed' : '';
      return (
        <span key={index} className={className}>
          {part.value}
        </span>
      );
    });
  };

  const renderSide = (side) => {
    let lineNumber = 1;
    return diffData.map((item, index) => {
      let content = null;
      let className = "diff-line";
      let displayLineNumber = "";

      if (item.type === 'modification') {
        const line = side === 'left' ? item.oldLine : item.newLine;
        if (line !== null) {
          content = renderCharDiff(item.oldLine, item.newLine, side);
          className += side === 'left' ? " line-removed" : " line-added";
          displayLineNumber = lineNumber++;
        } else {
          className += " line-empty";
        }
      } else if (item.type === 'added') {
        if (side === 'right') {
          content = item.line;
          className += " line-added-full";
          displayLineNumber = lineNumber++;
        } else {
          className += " line-empty";
        }
      } else if (item.type === 'removed') {
        if (side === 'left') {
          content = item.line;
          className += " line-removed-full";
          displayLineNumber = lineNumber++;
        } else {
          className += " line-empty";
        }
      } else {
        // unchanged
        content = item.line;
        displayLineNumber = lineNumber++;
      }

      return (
        <div key={index} className={className}>
          <div className="diff-line-number">{displayLineNumber}</div>
          <div className="diff-line-content">{content || ' '}</div>
        </div>
      );
    });
  };

  return (
    <div className="diff-container h-[calc(100vh-350px)]">
      <div className="grid grid-cols-2 h-full">
        <div 
          ref={leftRef}
          onScroll={handleScroll}
          className="overflow-auto diff-scroll-sync"
          style={{ borderRight: '1px solid var(--panel-border)' }}
        >
          <div className="diff-header">
            <span>Original</span>
          </div>
          <div className="py-2">
            {renderSide('left')}
          </div>
        </div>
        <div 
          ref={rightRef}
          onScroll={handleScroll}
          className="overflow-auto diff-scroll-sync"
        >
          <div className="diff-header">
            <span>Modified</span>
          </div>
          <div className="py-2">
            {renderSide('right')}
          </div>
        </div>
      </div>
    </div>
  );
}
