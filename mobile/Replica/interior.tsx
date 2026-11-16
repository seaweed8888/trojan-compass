import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import Wayfinder from "../../web/src/features/map/components/Wayfinder";
import { installNativeAPITransport } from "./api-bridge.mjs";
installNativeAPITransport();
createRoot(document.getElementById("root")!).render(
  <Suspense fallback={<p role="status">Loading map?</p>}>
    <Wayfinder bundled />
  </Suspense>,
);
