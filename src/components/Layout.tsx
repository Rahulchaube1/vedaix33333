const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="min-h-screen bg-light-primary dark:bg-[#0b0d10] lg:pl-64">
      <div className="mx-4 max-w-6xl lg:mx-auto">{children}</div>
    </main>
  );
};

export default Layout;
