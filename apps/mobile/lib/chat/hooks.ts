/**
 * Chat React Query Hooks
 * 
 * React Query hooks for threads, messages, and agent runs
 * Used internally by the main useChat hook
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { API_URL, getAuthToken, getAuthHeaders } from '@/api/config';
import type {
  Thread,
  Message,
  AgentRun,
  SendMessageInput,
  InitiateAgentInput,
  InitiateAgentResponse,
  ActiveAgentRun,
} from '@/api/types';

// ============================================================================
// Query Keys
// ============================================================================

export const chatKeys = {
  all: ['chat'] as const,
  threads: () => [...chatKeys.all, 'threads'] as const,
  thread: (id: string) => [...chatKeys.threads(), id] as const,
  messages: (threadId: string) => [...chatKeys.thread(threadId), 'messages'] as const,
  runs: (threadId: string) => [...chatKeys.thread(threadId), 'runs'] as const,
  run: (threadId: string, runId: string) => [...chatKeys.runs(threadId), runId] as const,
  activeRuns: () => [...chatKeys.all, 'active-runs'] as const,
};

// ============================================================================
// Thread Hooks
// ============================================================================

export function useThreads(
  projectId?: string,
  options?: Omit<UseQueryOptions<Thread[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...chatKeys.threads(), { projectId }],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const url = projectId
        ? `${API_URL}/threads?project_id=${projectId}`
        : `${API_URL}/threads`;

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`Failed to fetch threads: ${res.status}`);

      const data = await res.json();
      return data.threads || [];
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useThread(
  threadId: string | undefined,
  options?: Omit<UseQueryOptions<Thread, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: chatKeys.thread(threadId || ''),
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/threads/${threadId}`, { headers });
      if (!res.ok) throw new Error(`Failed to fetch thread: ${res.status}`);
      return res.json();
    },
    enabled: !!threadId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useUpdateThread(
  options?: UseMutationOptions<Thread, Error, { threadId: string; data: Partial<Thread> }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ threadId, data }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/threads/${threadId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Failed to update thread: ${res.status}`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
      queryClient.setQueryData(chatKeys.thread(data.thread_id), data);
    },
    ...options,
  });
}

export function useDeleteThread(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threadId) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/threads/${threadId}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error(`Failed to delete thread: ${res.status}`);
    },
    onSuccess: (_, threadId) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
      queryClient.removeQueries({ queryKey: chatKeys.thread(threadId) });
    },
    ...options,
  });
}

// ============================================================================
// Message Hooks
// ============================================================================

export function useMessages(
  threadId: string | undefined,
  params?: { limit?: number; offset?: number },
  options?: Omit<UseQueryOptions<Message[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...chatKeys.messages(threadId || ''), params],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const query = params
        ? `?${new URLSearchParams(params as any).toString()}`
        : '';

      const res = await fetch(`${API_URL}/threads/${threadId}/messages${query}`, { headers });
      if (!res.ok) throw new Error(`Failed to fetch messages: ${res.status}`);

      const data = await res.json();
      const messages = Array.isArray(data) ? data : data.messages || [];

      // Sort messages by created_at in ascending order (oldest first)
      return messages.sort((a: any, b: any) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return timeA - timeB;
      });
    },
    enabled: !!threadId,
    staleTime: 1 * 60 * 1000,
    ...options,
  });
}

export function useAddMessage(
  options?: UseMutationOptions<Message, Error, { threadId: string; message: string }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ threadId, message }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/threads/${threadId}/messages/add`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error(`Failed to add message: ${res.status}`);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.threadId) });
    },
    ...options,
  });
}

export function useStartAgent(
  options?: UseMutationOptions<
    { agent_run_id: string; status: string },
    Error,
    { threadId: string; modelName?: string; agentId?: string }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ threadId, modelName, agentId }) => {
      const headers = await getAuthHeaders();

      const body: any = {};
      if (modelName) body.model_name = modelName;
      if (agentId) body.agent_id = agentId;

      const res = await fetch(`${API_URL}/thread/${threadId}/agent/start`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const error = await res.text().catch(() => 'Unknown error');
        throw new Error(`Failed to start agent: ${res.status} - ${error}`);
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.runs(variables.threadId) });
    },
    ...options,
  });
}

export function useSendMessage(
  options?: UseMutationOptions<
    { message: Message; agentRunId: string },
    Error,
    SendMessageInput
  >
) {
  const addMessage = useAddMessage();
  const startAgent = useStartAgent();

  return useMutation({
    mutationFn: async (input) => {
      console.log('🚀 [useSendMessage] Step 1: Adding message to thread', input.threadId);

      const message = await addMessage.mutateAsync({
        threadId: input.threadId,
        message: input.message,
      });

      console.log('✅ [useSendMessage] Step 1 complete: Message added', message);
      console.log('🚀 [useSendMessage] Step 2: Starting agent run');

      const agentRun = await startAgent.mutateAsync({
        threadId: input.threadId,
        modelName: input.modelName,
        agentId: input.agentId,
      });

      console.log('✅ [useSendMessage] Step 2 complete: Agent started', agentRun);

      return {
        message,
        agentRunId: agentRun.agent_run_id,
      };
    },
    ...options,
  });
}

export function useDeleteMessage(
  options?: UseMutationOptions<void, Error, { threadId: string; messageId: string }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ threadId, messageId }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/threads/${threadId}/messages/${messageId}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error(`Failed to delete message: ${res.status}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.threadId) });
    },
    ...options,
  });
}

// ============================================================================
// Agent Run Hooks
// ============================================================================

export function useAgentRuns(
  threadId: string | undefined,
  options?: Omit<UseQueryOptions<AgentRun[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: chatKeys.runs(threadId || ''),
    queryFn: async () => {
      const headers = await getAuthHeaders();

      try {
        const res = await fetch(`${API_URL}/thread/${threadId}/agent-runs`, { headers });

        if (res.status === 404) return [];

        if (!res.ok) throw new Error(`Failed to fetch runs: ${res.status}`);

        const data = await res.json();
        return data.agent_runs || [];
      } catch (error: any) {
        if (error.message?.includes('404')) return [];
        throw error;
      }
    },
    enabled: !!threadId,
    staleTime: 30 * 1000,
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasRunning = data?.some((run: AgentRun) => run.status === 'running');
      return hasRunning ? 2000 : false;
    },
    ...options,
  });
}

export function useAgentRun(
  threadId: string | undefined,
  runId: string | undefined,
  options?: Omit<UseQueryOptions<AgentRun, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: chatKeys.run(threadId || '', runId || ''),
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/agent-run/${runId}`, { headers });
      if (!res.ok) throw new Error(`Failed to fetch run: ${res.status}`);
      return res.json();
    },
    enabled: !!threadId && !!runId,
    staleTime: 30 * 1000,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === 'running' ? 2000 : false;
    },
    ...options,
  });
}

export function useCancelAgentRun(
  options?: UseMutationOptions<void, Error, { threadId: string; runId: string }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ runId }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/agent-run/${runId}/stop`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`Failed to cancel run: ${res.status}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.runs(variables.threadId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.run(variables.threadId, variables.runId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.activeRuns() });
    },
    ...options,
  });
}

export function useActiveAgentRuns(
  options?: Omit<UseQueryOptions<ActiveAgentRun[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: chatKeys.activeRuns(),
    queryFn: async () => {
      const headers = await getAuthHeaders();
      try {
        const res = await fetch(`${API_URL}/agent-runs/active`, { headers });
        if (!res.ok) {
          console.warn(`Failed to fetch active runs: ${res.status}`);
          return [];
        }
        const data = await res.json();
        return data.active_runs || [];
      } catch (error) {
        console.error('Error fetching active runs:', error);
        return [];
      }
    },
    staleTime: 5 * 1000,
    refetchInterval: 10000,
    ...options,
  });
}

export function useAgentRunStatus(
  agentRunId: string | undefined,
  options?: Omit<UseQueryOptions<AgentRun, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['agent-run', agentRunId],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/agent-run/${agentRunId}`, { headers });
      if (!res.ok) throw new Error(`Failed to fetch agent run: ${res.status}`);
      return res.json();
    },
    enabled: !!agentRunId,
    staleTime: 1 * 1000,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'running' ? 2000 : false;
    },
    ...options,
  });
}

export function useStopAgentRun(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentRunId: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/agent-run/${agentRunId}/stop`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`Failed to stop agent run: ${res.status}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
      queryClient.invalidateQueries({ queryKey: chatKeys.activeRuns() });
    },
    ...options,
  });
}

export function useInitiateAgent(
  options?: UseMutationOptions<InitiateAgentResponse, Error, InitiateAgentInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input) => {
      const token = await getAuthToken();
      if (!token) throw new Error('Authentication required');

      const formData = new FormData();
      formData.append('prompt', input.prompt);

      if (input.agent_id) formData.append('agent_id', input.agent_id);
      if (input.model_name) formData.append('model_name', input.model_name);
      if (input.files?.length) {
        input.files.forEach((file) => formData.append('files', file));
      }

      const res = await fetch(`${API_URL}/agent/initiate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const error = await res.text().catch(() => 'Unknown error');
        throw new Error(`Failed to initiate agent: ${res.status} - ${error}`);
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
      queryClient.setQueryData(chatKeys.thread(data.thread_id), data);
    },
    ...options,
  });
}

