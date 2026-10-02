import React from "react";
import DeviceFrame from "@/components/gallery/DeviceFrame.jsx";
import { renderGeneratorType, renderRegistryRecord, renderAgent, renderAdapter } from "@/lib/visualizer/visualizerRenderer.js";

export default function VisualizerPreview({ type, record, entityName, agent, adapter, displayW = 232, config }) {
  let result;
  if (agent) result = renderAgent(agent, config);
  else if (adapter) result = renderAdapter(adapter, config);
  else if (record) result = renderRegistryRecord(record, entityName, config);
  else result = renderGeneratorType(type, config);
  const { frame, designW, designH, html } = result;
  return (
    <DeviceFrame type={frame} designW={designW} designH={designH} displayW={displayW}>
      <div style={{ width: designW, height: designH }} dangerouslySetInnerHTML={{ __html: html }} />
    </DeviceFrame>
  );
}