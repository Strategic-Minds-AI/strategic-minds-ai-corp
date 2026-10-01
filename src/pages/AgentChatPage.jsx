import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import AgentCommandCenter from "@/pages/AgentCommandCenter";

export default function AgentChatPage() {
  const { agentName } = useParams();
  return <AgentCommandCenter initialAgent={agentName} />;
}