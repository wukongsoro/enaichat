export interface UsageExampleMessage {
  role: 'user' | 'assistant';
  content: string;
  tool_calls?: Array<{
    name: string;
    arguments?: Record<string, any>;
  }>;
}

export interface MarketplaceTemplate {
  id: string;
  creator_id: string;
  name: string;
  description: string;
  system_prompt?: string;
  tags: string[];
  download_count: number;
  creator_name: string;
  created_at: string;
  marketplace_published_at?: string;
  icon_name?: string;
  icon_color?: string;
  icon_background?: string;
  template_id: string;
  is_kortix_team?: boolean;
  model?: string;
  agentpress_tools?: Record<string, any>;
  mcp_requirements?: Array<{
    qualified_name: string;
    display_name: string;
    enabled_tools?: string[];
    required_config: string[];
    custom_type?: 'sse' | 'http' | 'composio';
    toolkit_slug?: string;
    app_slug?: string;
    source?: 'trigger' | 'tool';
    trigger_index?: number;
  }>;
  usage_examples?: UsageExampleMessage[];
  metadata?: {
    source_agent_id?: string;
    source_version_id?: string;
    source_version_name?: string;
  };
  config?: {
    triggers?: Array<{
      name: string;
      description?: string;
      trigger_type: string;
      is_active: boolean;
      config: Record<string, any>;
    }>;
  };
}

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  type: 'credential_profile' | 'composio_profile' | 'custom_server';
  service_name: string;
  qualified_name: string;
  custom_type?: string;
  app_slug?: string;
  app_name?: string;
  required_fields?: Array<{
    key: string;
    label: string;
    type: string;
    placeholder: string;
    description?: string;
  }>;
  source?: 'trigger' | 'tool';
  trigger_slug?: string;
  trigger_index?: number;
  trigger_fields?: Record<string, { type: string; required: boolean }>;
  required_config?: string[];
}
