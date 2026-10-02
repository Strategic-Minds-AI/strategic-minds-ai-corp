import React from "react";
import DeviceFrame from "./DeviceFrame.jsx";
import { renderPreview } from "@/lib/gallery/previewRenderer.js";

export default function TemplatePreview({ template, platform, displayW = 300, config }) {
  const { frame, designW, designH, html } = renderPreview(template, platform, config);
  return (
    <DeviceFrame type={frame} designW={designW} designH={designH} displayW={displayW}>
      <div style={{ width: designW, height: designH }} dangerouslySetInnerHTML={{ __html: html }} />
    </DeviceFrame>
  );
}