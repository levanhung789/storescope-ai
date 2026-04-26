import type { Metadata } from "next";
import ForumClient from "./ForumClient";

export const metadata: Metadata = {
  title: "Forum — StoreScope AI",
  description: "Chia sẻ kinh nghiệm bán lẻ, trao đổi bố trí cửa hàng, mua bán layout trên ARC Network.",
};

export default function ForumPage() {
  return <ForumClient />;
}
