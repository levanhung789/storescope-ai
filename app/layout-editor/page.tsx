"use client";

import dynamic from "next/dynamic";

const LayoutEditor = dynamic(
  () => import("../_components/LayoutEditor/LayoutEditor"),
  { ssr: false, loading: () => <div style={{ height: "100vh", background: "#080808" }} /> }
);

export default function LayoutEditorPage() {
  return <LayoutEditor />;
}
