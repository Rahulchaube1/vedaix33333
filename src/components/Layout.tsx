const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="min-h-screen bg-light-primary text-black dark:bg-dark-primary dark:text-white lg:pl-[248px]">
      <div className="mx-auto min-h-screen max-w-[1180px] px-4 sm:px-6 lg:px-10">
        {children}
      </div>
    </main>
  );
};

export default Layout;
