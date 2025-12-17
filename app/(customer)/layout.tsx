/**
 * Customer Layout
 * Layout for customer-facing pages with navbar
 */

import Navbar from "@/src/components/Navbar";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
