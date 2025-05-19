
import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import Header from './Header';
import AppSidebar from './AppSidebar';
import { ResizablePanelGroup } from '@/components/ui/resizable';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
