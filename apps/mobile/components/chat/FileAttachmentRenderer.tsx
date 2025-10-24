/**
 * File Attachment Renderer - Modular component for rendering uploaded files
 * 
 * Supports:
 * - Images (jpg, jpeg, png, gif, webp, svg)
 * - Documents (pdf, doc, docx, etc.)
 * - Other file types
 * 
 * Can be used in:
 * - Chat messages
 * - Tool outputs
 * - Any context where files need to be displayed
 */

import React, { useState, useMemo } from 'react';
import { View, Image, Pressable, ActivityIndicator, Linking } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { FileText, File, Download, ExternalLink, Image as ImageIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring 
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FileAttachment {
  path: string;
  type: 'image' | 'document' | 'other';
  name: string;
  extension?: string;
}

interface FileAttachmentRendererProps {
  /** File path from sandbox */
  filePath: string;
  /** Sandbox ID to construct download URL */
  sandboxId?: string;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Show filename */
  showName?: boolean;
  /** Custom onPress handler */
  onPress?: (filePath: string) => void;
}

/**
 * Parse file path and determine type
 */
function parseFilePath(path: string): FileAttachment {
  const name = path.split('/').pop() || 'file';
  const extension = name.split('.').pop()?.toLowerCase();
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
  const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'];
  
  let type: 'image' | 'document' | 'other' = 'other';
  
  if (extension && imageExtensions.includes(extension)) {
    type = 'image';
  } else if (extension && documentExtensions.includes(extension)) {
    type = 'document';
  }
  
  return { path, type, name, extension };
}

/**
 * Main File Attachment Renderer Component
 */
export function FileAttachmentRenderer({
  filePath,
  sandboxId,
  compact = false,
  showName = true,
  onPress,
}: FileAttachmentRendererProps) {
  const file = useMemo(() => parseFilePath(filePath), [filePath]);
  
  switch (file.type) {
    case 'image':
      return (
        <ImageAttachment 
          file={file} 
          sandboxId={sandboxId}
          compact={compact}
          showName={showName}
          onPress={onPress}
        />
      );
    case 'document':
      return (
        <DocumentAttachment 
          file={file}
          compact={compact}
          onPress={onPress}
        />
      );
    default:
      return (
        <GenericAttachment 
          file={file}
          compact={compact}
          onPress={onPress}
        />
      );
  }
}

/**
 * Image Attachment Component
 */
function ImageAttachment({
  file,
  sandboxId,
  compact,
  showName,
  onPress,
}: {
  file: FileAttachment;
  sandboxId?: string;
  compact: boolean;
  showName: boolean;
  onPress?: (path: string) => void;
}) {
  const { colorScheme } = useColorScheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const scale = useSharedValue(1);
  
  // Construct image URL
  // For now, we'll use the sandbox file API endpoint
  // TODO: Update with actual API endpoint once available
  const imageUrl = sandboxId 
    ? `https://api.example.com/sandboxes/${sandboxId}/files/content?path=${encodeURIComponent(file.path)}`
    : file.path; // Fallback to path

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (onPress) {
      onPress(file.path);
    }
  };

  const containerSize = compact ? 120 : 200;
  
  return (
    <View className="mb-2">
      <AnimatedPressable
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        }}
        onPress={handlePress}
        style={[animatedStyle]}
        className="rounded-xl overflow-hidden border border-border bg-card"
      >
        <View style={{ width: containerSize, height: containerSize }}>
          {!hasError ? (
            <>
              <Image
                source={{ uri: imageUrl }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
              />
              
              {isLoading && (
                <View className="absolute inset-0 bg-muted/50 items-center justify-center">
                  <ActivityIndicator 
                    size="small" 
                    color={colorScheme === 'dark' ? '#ffffff' : '#000000'} 
                  />
                </View>
              )}
            </>
          ) : (
            <View className="flex-1 items-center justify-center bg-muted/30">
              <Icon 
                as={ImageIcon} 
                size={32} 
                className="text-muted-foreground mb-2"
                strokeWidth={1.5}
              />
              <Text className="text-xs text-muted-foreground">
                Failed to load
              </Text>
            </View>
          )}
        </View>
        
        {/* Image overlay with icon */}
        {!isLoading && !hasError && (
          <View className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5">
            <Icon 
              as={ExternalLink} 
              size={12} 
              className="text-white"
              strokeWidth={2}
            />
          </View>
        )}
      </AnimatedPressable>
      
      {showName && (
        <Text 
          className="text-xs text-muted-foreground mt-1.5 font-roobert"
          numberOfLines={1}
          style={{ width: containerSize }}
        >
          {file.name}
        </Text>
      )}
    </View>
  );
}

/**
 * Document Attachment Component
 */
function DocumentAttachment({
  file,
  compact,
  onPress,
}: {
  file: FileAttachment;
  compact: boolean;
  onPress?: (path: string) => void;
}) {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (onPress) {
      onPress(file.path);
    }
  };

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      onPress={handlePress}
      style={animatedStyle}
      className="flex-row items-center bg-muted/30 rounded-xl px-3 py-3 border border-border/30 mb-2 active:bg-muted/50"
    >
      <View className="bg-primary/10 rounded-lg p-2 mr-3">
        <Icon 
          as={FileText} 
          size={compact ? 18 : 20} 
          className="text-primary"
          strokeWidth={2}
        />
      </View>
      
      <View className="flex-1">
        <Text 
          className="text-sm font-roobert-medium text-foreground"
          numberOfLines={1}
        >
          {file.name}
        </Text>
        {file.extension && (
          <Text className="text-xs text-muted-foreground font-roobert mt-0.5">
            {file.extension.toUpperCase()} Document
          </Text>
        )}
      </View>
      
      <Icon 
        as={ExternalLink} 
        size={16} 
        className="text-muted-foreground ml-2"
        strokeWidth={2}
      />
    </AnimatedPressable>
  );
}

/**
 * Generic File Attachment Component
 */
function GenericAttachment({
  file,
  compact,
  onPress,
}: {
  file: FileAttachment;
  compact: boolean;
  onPress?: (path: string) => void;
}) {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (onPress) {
      onPress(file.path);
    }
  };

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      onPress={handlePress}
      style={animatedStyle}
      className="flex-row items-center bg-muted/30 rounded-xl px-3 py-3 border border-border/30 mb-2 active:bg-muted/50"
    >
      <View className="bg-muted rounded-lg p-2 mr-3">
        <Icon 
          as={File} 
          size={compact ? 18 : 20} 
          className="text-muted-foreground"
          strokeWidth={2}
        />
      </View>
      
      <View className="flex-1">
        <Text 
          className="text-sm font-roobert-medium text-foreground"
          numberOfLines={1}
        >
          {file.name}
        </Text>
        {file.extension && (
          <Text className="text-xs text-muted-foreground font-roobert mt-0.5">
            {file.extension.toUpperCase()} File
          </Text>
        )}
      </View>
      
      <Icon 
        as={Download} 
        size={16} 
        className="text-muted-foreground ml-2"
        strokeWidth={2}
      />
    </AnimatedPressable>
  );
}

/**
 * Parse message content and extract file references
 * Matches: [Uploaded File: /workspace/uploads/filename.ext]
 */
export function extractFileReferences(content: string): string[] {
  const filePattern = /\[Uploaded File: ([^\]]+)\]/g;
  const matches = content.matchAll(filePattern);
  const files: string[] = [];
  
  for (const match of matches) {
    files.push(match[1]);
  }
  
  return files;
}

/**
 * Remove file references from content to get clean text
 */
export function removeFileReferences(content: string): string {
  return content.replace(/\[Uploaded File: [^\]]+\]/g, '').trim();
}

/**
 * Multi-file attachment renderer
 */
export function FileAttachmentsGrid({
  filePaths,
  sandboxId,
  compact = false,
  onFilePress,
}: {
  filePaths: string[];
  sandboxId?: string;
  compact?: boolean;
  onFilePress?: (path: string) => void;
}) {
  if (filePaths.length === 0) return null;
  
  return (
    <View className="my-2">
      {filePaths.map((path, index) => (
        <FileAttachmentRenderer
          key={`${path}-${index}`}
          filePath={path}
          sandboxId={sandboxId}
          compact={compact}
          onPress={onFilePress}
        />
      ))}
    </View>
  );
}

