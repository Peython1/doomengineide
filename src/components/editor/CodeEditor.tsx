
import React, { useRef, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface CodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
}

// Placeholder para o monaco editor
const CodeEditor = ({ code, onCodeChange }: CodeEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Simulador de syntax highlighting para Lua
  const formatCode = () => {
    if (!code) return [];
    
    const lines = code.split('\n');
    return lines.map((line, i) => {
      // Simplificação do syntax highlighting
      let formattedLine = line;
      
      // Comentários
      if (line.trim().startsWith('--')) {
        return <div key={i} className="text-lua-comment">{line}</div>;
      }
      
      // Keywords
      const keywords = ['function', 'end', 'if', 'then', 'else', 'elseif', 'for', 'while', 'do', 'return', 'local', 'and', 'or', 'not'];
      let parts: React.ReactNode[] = [line];
      
      keywords.forEach(keyword => {
        parts = parts.map(part => {
          if (typeof part !== 'string') return part;
          
          const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
          const splitParts = part.split(regex);
          
          if (splitParts.length === 1) return part;
          
          return splitParts.map((text, j) => {
            if (j % 2 === 1) { // É uma keyword
              return <span key={`${i}-${j}`} className="text-lua-keyword">{text}</span>;
            }
            return text;
          });
        }).flat();
      });
      
      return <div key={i} className="font-mono">{parts}</div>;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      
      // Inserir 2 espaços em vez da tabulação
      const target = e.target as HTMLDivElement;
      const content = code;
      const selectionStart = getSelectionStart(target);
      const selectionEnd = getSelectionEnd(target);
      
      if (selectionStart !== null && selectionEnd !== null) {
        const newContent = 
          content.substring(0, selectionStart) + 
          '  ' +
          content.substring(selectionEnd);
        
        onCodeChange(newContent);
        
        // Ajustar a posição do cursor após a inserção
        setTimeout(() => {
          setSelection(target, selectionStart + 2, selectionStart + 2);
        }, 0);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      
      // Adicionar nova linha e preservar a indentação
      const target = e.target as HTMLDivElement;
      const content = code;
      const selectionStart = getSelectionStart(target);
      
      if (selectionStart !== null) {
        // Encontrar o início da linha atual
        const lineStart = content.lastIndexOf('\n', selectionStart - 1) + 1;
        const currentLine = content.substring(lineStart, selectionStart);
        
        // Detectar indentação da linha atual
        const indentMatch = currentLine.match(/^(\s+)/);
        const indent = indentMatch ? indentMatch[1] : '';
        
        const newContent = 
          content.substring(0, selectionStart) + 
          '\n' + indent +
          content.substring(selectionStart);
        
        onCodeChange(newContent);
        
        // Ajustar a posição do cursor após a inserção
        setTimeout(() => {
          const newPos = selectionStart + 1 + indent.length;
          setSelection(target, newPos, newPos);
        }, 0);
      }
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    onCodeChange(target.innerText);
  };

  // Funções auxiliares para manipular a seleção
  const getSelectionStart = (element: HTMLDivElement): number | null => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;
    
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.startContainer, range.startOffset);
    return preCaretRange.toString().length;
  };
  
  const getSelectionEnd = (element: HTMLDivElement): number | null => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;
    
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  };
  
  const setSelection = (element: HTMLDivElement, start: number, end: number) => {
    const charIndex = 0;
    let done = false;
    
    const traverseNodes = (node: Node): boolean => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textNode = node as Text;
        const nextCharIndex = charIndex + textNode.length;
        
        if (!done && start >= charIndex && start <= nextCharIndex) {
          const startOffset = start - charIndex;
          const selection = window.getSelection();
          const range = document.createRange();
          
          range.setStart(node, startOffset);
          
          if (end === start) {
            range.setEnd(node, startOffset);
          } else if (end >= charIndex && end <= nextCharIndex) {
            range.setEnd(node, end - charIndex);
          }
          
          selection?.removeAllRanges();
          selection?.addRange(range);
          done = true;
        }
        return nextCharIndex;
      } else {
        let currentIndex = charIndex;
        for (let i = 0; i < node.childNodes.length; i++) {
          currentIndex = traverseNodes(node.childNodes[i]);
          if (done) break;
        }
        return currentIndex;
      }
    };
    
    traverseNodes(element);
  };

  return (
    <Card className="border-0 shadow-none h-full flex flex-col">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>main.lua</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto">
        <div 
          className="bg-editor-bg text-editor-foreground p-4 font-mono text-sm h-full overflow-auto"
          style={{ lineHeight: "1.5" }}
        >
          <div className="monaco-editor-container" ref={editorRef}>
            <div 
              className="editable-code"
              contentEditable={true}
              suppressContentEditableWarning={true}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              style={{ outline: 'none', whiteSpace: 'pre-wrap' }}
            >
              {code}
            </div>
            <div className="code-display hidden">
              {formatCode().map((line, i) => (
                <div key={i} className="flex">
                  <div className="text-editor-line w-10 text-right pr-4 select-none opacity-50">
                    {i+1}
                  </div>
                  <div className="flex-1">{line}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CodeEditor;
