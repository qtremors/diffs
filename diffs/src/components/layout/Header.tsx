// ---------------------------------------------------------------------------
// Header — app header with logo and title
// ---------------------------------------------------------------------------

import React from "react";
import Image from "next/image";
import { APP_NAME } from "@/lib/constants";

export default function Header() {
  return (
    <header className="app-header">
      <div className="header-brand">
        <Image src="/diffs.png" alt="Diffs logo" width={32} height={32} className="header-logo" />
        <div>
          <h1 className="header-title">{APP_NAME}</h1>
          <p className="header-subtitle">Compare anything — text, images, and more.</p>
        </div>
      </div>
    </header>
  );
}
