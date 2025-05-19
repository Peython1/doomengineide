
import React from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import CodeEditor from './editor/CodeEditor';
import ConsoleOutput from './console/ConsoleOutput';
import GamePreview from './preview/GamePreview';
import FileExplorer from './fileExplorer/FileExplorer';

const IDE = () => {
  return (
    <div className="h-[calc(100vh-56px)] w-full">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20} minSize={15}>
          <FileExplorer />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={45} minSize={30}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={70} minSize={30}>
              <CodeEditor />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={20}>
              <ConsoleOutput />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={35} minSize={30}>
          <GamePreview />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default IDE;
